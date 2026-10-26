import { IsISO8601, IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsISO8601()
  startsAt: string;

  /** Quantas pessoas saem da fila (são liberadas para comprar) por minuto. */
  @IsOptional()
  @IsInt()
  @Min(1)
  admitPerMinute?: number;

  /** Quanto tempo a pessoa liberada tem para comprar. */
  @IsOptional()
  @IsInt()
  @Min(1)
  admitTtlSeconds?: number;
}
