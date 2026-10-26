import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("events")
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column() // Date vira datetime (SQLite) ou timestamp (Postgres)
  startsAt: Date;

  /** Quantas pessoas saem da fila (são liberadas para comprar) por minuto. */
  @Column({ type: "int", default: 60 })
  admitPerMinute: number;

  /** Quanto tempo a pessoa liberada tem para comprar. */
  @Column({ type: "int", default: 600 })
  admitTtlSeconds: number;

  @CreateDateColumn()
  createdAt: Date;
}
