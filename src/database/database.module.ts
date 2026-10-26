import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

/**
 * Com DATABASE_URL (postgres://...) usa Postgres; sem ela, usa um arquivo
 * SQLite (zero configuração, bom para desenvolvimento).
 *
 * `synchronize` cria/atualiza as tabelas sozinho. Serve para este estágio;
 * antes de produção troque por migrations.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        return url
          ? {
              type: "postgres" as const,
              url,
              autoLoadEntities: true,
              synchronize: true,
            }
          : {
              type: "better-sqlite3" as const,
              database: process.env.SQLITE_PATH ?? "data/tickets.sqlite",
              autoLoadEntities: true,
              synchronize: true,
            };
      },
    }),
  ],
})
export class DatabaseModule {}
