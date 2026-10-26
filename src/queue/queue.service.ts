import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { Event } from "../events/event.entity";
import { EventsService } from "../events/events.service";
import { REDIS, createConnection } from "../redis/redis.module";

/**
 * Uma fila BullMQ por evento. O BullMQ cuida da ordem (FIFO), do ritmo de
 * liberação (limiter) e da persistência. Como o BullMQ não expõe "posição na
 * fila" de forma barata, mantemos um sorted set por evento (score = nº da
 * senha) e usamos ZRANK, que é O(log n).
 *
 * Os workers são criados dinamicamente (um por evento), por isso usamos o
 * BullMQ direto em vez de @Processor, que exige nome de fila estático.
 *
 * Chaves Redis por evento:
 *   queue:seq:{eventId}                 contador de senhas
 *   queue:waiting:{eventId}             zset userId -> senha (quem ainda espera)
 *   queue:admitted:{eventId}:{userId}   existe enquanto o usuário pode comprar (TTL)
 */

interface TicketJob {
  userId: string;
}

export type QueueStatus =
  | { status: "waiting"; position: number; total: number }
  | { status: "admitted"; expiresInSeconds: number }
  | { status: "not_in_queue" };

const queueName = (eventId: string) => `tickets-${eventId}`;
const seqKey = (eventId: string) => `queue:seq:${eventId}`;
const waitingKey = (eventId: string) => `queue:waiting:${eventId}`;
const admittedKey = (eventId: string, userId: string) =>
  `queue:admitted:${eventId}:${userId}`;

@Injectable()
export class QueueService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly queues = new Map<string, Queue<TicketJob>>();
  private readonly workers = new Map<string, Worker<TicketJob>>();

  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly events: EventsService,
  ) {}

  /** Retoma as filas dos eventos já cadastrados. */
  async onApplicationBootstrap() {
    for (const event of await this.events.list()) this.startWorker(event);
  }

  async onApplicationShutdown() {
    await Promise.all([...this.workers.values()].map((w) => w.close()));
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }

  private getQueue(eventId: string): Queue<TicketJob> {
    let q = this.queues.get(eventId);
    if (!q) {
      q = new Queue<TicketJob>(queueName(eventId), {
        connection: createConnection(),
        defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
      });
      this.queues.set(eventId, q);
    }
    return q;
  }

  /** Sobe o worker do evento (idempotente). Processar um job = liberar o usuário. */
  startWorker(event: Event): void {
    if (this.workers.has(event.id)) return;

    const worker = new Worker<TicketJob>(
      queueName(event.id),
      async (job) => {
        const { userId } = job.data;
        // Se o usuário saiu da fila enquanto o job estava ativo, ignora.
        const removed = await this.redis.zrem(waitingKey(event.id), userId);
        if (removed === 0) return;
        await this.redis.set(
          admittedKey(event.id, userId),
          "1",
          "EX",
          event.admitTtlSeconds,
        );
      },
      {
        connection: createConnection(),
        concurrency: 1,
        limiter: { max: event.admitPerMinute, duration: 60_000 },
      },
    );
    worker.on("error", (err) => console.error(`[worker ${event.id}]`, err));
    this.workers.set(event.id, worker);
  }

  async join(eventId: string, userId: string): Promise<QueueStatus> {
    const current = await this.status(eventId, userId);
    if (current.status !== "not_in_queue") return current; // idempotente

    const ticket = await this.redis.incr(seqKey(eventId));
    const added = await this.redis.zadd(waitingKey(eventId), "NX", ticket, userId);
    if (added === 1) {
      // jobId = userId impede duplicar o mesmo usuário na fila do BullMQ.
      await this.getQueue(eventId).add("admit", { userId }, { jobId: userId });
    }
    return this.status(eventId, userId);
  }

  async leave(eventId: string, userId: string): Promise<boolean> {
    const removed = await this.redis.zrem(waitingKey(eventId), userId);
    const hadAdmission = await this.redis.del(admittedKey(eventId, userId));
    if (removed === 1) {
      try {
        await (await this.getQueue(eventId).getJob(userId))?.remove();
      } catch {
        // Job ativo não pode ser removido; o worker o ignora porque o userId
        // já saiu do zset de espera.
      }
    }
    return removed === 1 || hadAdmission === 1;
  }

  async status(eventId: string, userId: string): Promise<QueueStatus> {
    const rank = await this.redis.zrank(waitingKey(eventId), userId);
    if (rank !== null) {
      const total = await this.redis.zcard(waitingKey(eventId));
      return { status: "waiting", position: rank + 1, total };
    }
    const ttl = await this.redis.ttl(admittedKey(eventId, userId));
    if (ttl > 0) return { status: "admitted", expiresInSeconds: ttl };
    return { status: "not_in_queue" };
  }

  size(eventId: string): Promise<number> {
    return this.redis.zcard(waitingKey(eventId));
  }
}
