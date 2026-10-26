import { Global, Module, OnApplicationShutdown, Inject } from "@nestjs/common";
import { Redis } from "ioredis";

export const REDIS = Symbol("REDIS");
// BullMQ exige maxRetriesPerRequest: null nas conexões usadas por Workers.
// A URL é lida na hora da conexão, depois do .env ser carregado no main.ts.
export function createConnection(): Redis {
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });
}

@Global()
@Module({
  providers: [{ provide: REDIS, useFactory: createConnection }],
  exports: [REDIS],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown() {
    await this.redis.quit();
  }
}
