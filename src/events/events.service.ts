import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateEventDto } from "./create-event.dto";
import { Event } from "./event.entity";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly repo: Repository<Event>,
  ) {}

  create(dto: CreateEventDto): Promise<Event> {
    return this.repo.save(
      this.repo.create({ ...dto, startsAt: new Date(dto.startsAt) }),
    );
  }

  async findOrFail(id: string): Promise<Event> {
    const event = await this.repo.findOneBy({ id });
    if (!event) throw new NotFoundException("event_not_found");
    return event;
  }

  list(): Promise<Event[]> {
    return this.repo.find({ order: { startsAt: "ASC" } });
  }
}
