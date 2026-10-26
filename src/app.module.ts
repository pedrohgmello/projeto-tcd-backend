import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { EventsModule } from "./events/events.module";
import { QueueModule } from "./queue/queue.module";
import { RedisModule } from "./redis/redis.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [DatabaseModule, RedisModule, UsersModule, EventsModule, QueueModule],
})
export class AppModule {}
