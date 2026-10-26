import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { QueueService } from "../queue/queue.service";
import { CreateEventDto } from "./create-event.dto";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly queue: QueueService,
  ) {}

  @Post()
  async create(@Body() dto: CreateEventDto) {
    const event = await this.events.create(dto);
    this.queue.startWorker(event);
    return event;
  }

  @Get()
  list() {
    return this.events.list();
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const event = await this.events.findOrFail(id);
    return { ...event, waiting: await this.queue.size(id) };
  }
}
