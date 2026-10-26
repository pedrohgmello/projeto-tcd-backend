# ticket-queue

Backend de fila de ingressos com BullMQ + Redis + NestJS.

## Rodar

```powershell
cp .env.example .env       # ajuste REDIS_URL (e DATABASE_URL, se quiser Postgres)
docker compose up -d      # sobe o Redis local (ou use qualquer Redis em REDIS_URL)
npm run dev               # http://localhost:3000
```

## API

| Método | Rota | Corpo | Descrição |
|---|---|---|---|
| POST | `/users` | `{ name, email }` | Cadastra usuário (e-mail único) |
| GET | `/users`, `/users/:id` | | Lista / busca usuário |
| POST | `/events` | `{ name, startsAt (ISO), admitPerMinute?, admitTtlSeconds? }` | Cadastra evento e sobe a fila dele |
| GET | `/events` | | Lista eventos |
| GET | `/events/:id` | | Detalhe + quantos estão esperando |
| POST | `/events/:id/queue/join` | `{ userId }` | Entra na fila (idempotente); o usuário precisa existir |
| POST | `/events/:id/queue/leave` | `{ userId }` | Sai da fila |
| GET | `/events/:id/queue/position/:userId` | | `waiting` (posição/total), `admitted` (tempo restante) ou `not_in_queue` |

Exemplo:

```powershell
$u = Invoke-RestMethod -Method Post localhost:3000/users -ContentType application/json `
  -Body '{"name":"Ana","email":"ana@example.com"}'
$e = Invoke-RestMethod -Method Post localhost:3000/events -ContentType application/json `
  -Body '{"name":"Show","startsAt":"2026-12-01T20:00:00Z","admitPerMinute":2}'
Invoke-RestMethod -Method Post "localhost:3000/events/$($e.id)/queue/join" -ContentType application/json -Body (@{userId=$u.id} | ConvertTo-Json)
Invoke-RestMethod "localhost:3000/events/$($e.id)/queue/position/$($u.id)"
```

## Estrutura

- `src/redis` — conexão Redis global.
- `src/database` — TypeORM: Postgres se houver `DATABASE_URL`, senão SQLite em `data/tickets.sqlite`.
- `src/users` e `src/events` — cadastro de usuários e eventos (persistidos no banco SQL).
- `src/queue` — `QueueService` (filas/workers BullMQ) e endpoints de entrar/sair/posição.

## Como funciona

- Uma fila BullMQ por evento (`tickets-{eventId}`); o job é o usuário esperando.
  Os workers são criados dinamicamente, por isso o BullMQ é usado direto, sem `@Processor`.
- O worker libera `admitPerMinute` pessoas/min (limiter do BullMQ) — liberar = gravar
  uma chave com TTL `admitTtlSeconds` indicando que o usuário pode comprar.
- A posição vem de um sorted set por evento (`ZRANK`), exata e barata, mesmo com gente saindo.

## Fica para depois

Autenticação (hoje `userId` vem do cliente), migrations (hoje `synchronize: true`), compra/estoque de ingressos, abertura da fila só na
data do evento, SSE/WebSocket para atualizar posição, testes.
