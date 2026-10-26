import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateUserDto } from "./create-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  list() {
    return this.users.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.users.findOrFail(id);
  }
}
