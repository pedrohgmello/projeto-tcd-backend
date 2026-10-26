import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QueueModule } from "../queue/queue.module";
import { EventsController } from "./events.controller";
import { Event } from "./event.entity";
import { EventsService } from "./events.service";

@Module({
  imports: [TypeOrmModule.forFeature([Event]), forwardRef(() => QueueModule)],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
