import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { EventsService } from "../events/events.service";
import { UsersService } from "../users/users.service";
import { QueueUserDto } from "./queue-user.dto";
import { QueueService } from "./queue.service";

@Controller("events/:eventId/queue")
export class QueueController {
  constructor(
    private readonly queue: QueueService,
    private readonly events: EventsService,
    private readonly users: UsersService,
  ) {}

  @Post("join")
  async join(@Param("eventId") eventId: string, @Body() dto: QueueUserDto) {
    await this.events.findOrFail(eventId);
    await this.users.findOrFail(dto.userId);
    return this.queue.join(eventId, dto.userId);
  }

  @Post("leave")
  async leave(@Param("eventId") eventId: string, @Body() dto: QueueUserDto) {
    await this.events.findOrFail(eventId);
    return { left: await this.queue.leave(eventId, dto.userId) };
  }

  @Get("position/:userId")
  async position(
    @Param("eventId") eventId: string,
    @Param("userId") userId: string,
  ) {
    await this.events.findOrFail(eventId);
    return this.queue.status(eventId, userId);
  }
}
