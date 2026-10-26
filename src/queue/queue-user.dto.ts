import { IsNotEmpty, IsString } from "class-validator";

// O userId vem do cliente (ainda sem autenticação), mas precisa existir em /users.
export class QueueUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
