import { Module, forwardRef } from "@nestjs/common";
import { EventsModule } from "../events/events.module";
import { UsersModule } from "../users/users.module";
import { QueueController } from "./queue.controller";
import { QueueService } from "./queue.service";

@Module({
  imports: [forwardRef(() => EventsModule), UsersModule],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
