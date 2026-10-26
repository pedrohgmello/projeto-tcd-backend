import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./create-user.dto";
import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const email = dto.email.toLowerCase();
    if (await this.repo.existsBy({ email })) {
      throw new ConflictException("email_already_registered");
    }
    return this.repo.save(this.repo.create({ name: dto.name, email }));
  }

  async findOrFail(id: string): Promise<User> {
    const user = await this.repo.findOneBy({ id });
    if (!user) throw new NotFoundException("user_not_found");
    return user;
  }

  list(): Promise<User[]> {
    return this.repo.find({ order: { createdAt: "ASC" } });
  }
}
