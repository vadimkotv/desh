# AgentIPO — что реализовано и какие флоу (2026-09-12)

## Компоненты

| Компонент | Стек | Состояние |
| --- | --- | --- |
| `packages/contracts` | Foundry, Solidity 0.8.24 | `RoundEscrow` + `ExitReturns`: createRound / invest / finalize / releaseMilestone / refund / **settleExit** / claim. 52 теста. **Задеплоен только на локальный anvil-форк Arc**, не на Arc testnet. |
| `apps/api` | NestJS 11, Prisma 7 (Postgres), viem, @x402/*, @hiero-ledger/sdk, Anthropic SDK | 9 модулей, ports & adapters, файлы ≤100 строк, 28 unit-тестов, typecheck/lint зелёные. |
| `apps/web` | Next.js 16, React 19, Tailwind 4, SSE | Командный центр, раунд, агенты, аудит. SVG-графики без библиотек. |
| `packages/shared` | zod | Единые контракты API ↔ web, константы сетей, математика роста. |

## Модель возврата капитала

Раунд продаёт **долю** (`equityBps`), а не обещает кэшбек с выручки. Доля фиксирует цену входа:
`entryValuation = raised × 10 000 / equityBps`. Деньги возвращаются **только на ликвидном событии** —
`ACQUISITION | IPO | TGE | CONTRACT`. Кэпа нет: сколько принёс экзит, столько и делится pro-rata.

Две детали, без которых модель дырявая:
- `settleExit` может вызвать **платформа или фаундер раунда**, больше никто (`NotAuthorized`).
- Экзит **замораживает расписание майлстоунов**, поэтому неразблокированный эскроу (`raised − released`)
  падает в пул для клеймов, а не зависает в контракте.

## Флоу 1 — Фаундер: раунд и data room

1. `POST /startups` — стартап: founder, treasury, token, сектор, **`links[]`** (сайт, twitter, github, docs, discord…).
2. `POST /rounds` — раунд: target USDC, deadline, майлстоуны (bps), **`equityBps`** (0.1%–50%). Если сконфигурирован Arc — платформенный ключ создаёт раунд в `RoundEscrow`.
3. `POST /data-room/startups/:id/refresh` — сбор сигналов со всех провайдеров параллельно; каждый источник снапшотится отдельно.
   - **The Graph Token API**: холдеры, top-10 концентрация, трансферы за 30 дней, уникальные отправители, стейблы в казне.
   - **Messari standardized DEX subgraph**: TVL и объём по пулам токена.
   - **Agent0 / ERC-8004 subgraph**: репутация агентов фаундера.
   - `DEMO_SIGNALS=true` — фикстура для офлайн-разработки, помечена `demo-fixture`.
4. `POST /data-room/startups/:id/metrics` — фаундер публикует свои цифры **как таймлайн** (`points[]`): MRR, юзеры, runway. У каждой метрики `visibility: PUBLIC | GATED`.
5. `POST /due-diligence/rounds/:id/generate` — 7 evaluator'ов (distribution, activity, treasury, liquidity, reputation, traction, **growth**) → findings → composite score + **data coverage**.

## Флоу 2 — Закрытые данные и доступ по запросу

Пейволла платформы больше нет: ресерч по публичным ончейн-данным бесплатен.

1. Агент в ходе прогона получает `GET /data-room/startups/:id/metrics?agentId=` — публичные метрики целиком, закрытые **withheld**: имя и единица видны, ряд значений пуст.
2. Если что-то закрыто, агент сам подаёт `POST /data-room/startups/:id/access` (идемпотентно — повторные прогоны не спамят фаундера).
3. Фаундер видит на странице раунда, **чей** это агент (имя, адрес владельца, тезис мандата) и жмёт **Open data** / **Deny** → `POST /data-room/access/:id/grant|deny`.
4. Со следующего цикла этот агент видит ряд; **другие агенты — нет**, грант поагентный.
5. В аудит идут `ACCESS_REQUESTED / ACCESS_GRANTED / ACCESS_DENIED`.

x402 остался как **опция**: `X402_GATE_REPORTS=true` (по умолчанию `false`) поднимает старый 402-пейволл на отчёт через Blocky402/Hedera. Дефолтный путь ключей Hedera не требует.

## Флоу 3 — Агент: создание, идентичность, режим

1. `POST /agents` — имя, владелец, тип кошелька, **`mode: AUTONOMOUS | ADVISORY`**, мандат (thesis, секторы, minScore, maxTicket, доля раунда, дневной бюджет, лимит на данные, risk tolerance).
2. Провижининг: HD-ключ из мастер-мнемоники (`m/44'/60'/0'/0/i`) — один secp256k1 ключ и для Arc, и для Hedera; либо Circle developer-controlled wallet на `ARC-TESTNET`.
3. `POST /agents/:id/identity` — регистрация в ERC-8004 Identity Registry (Sepolia); `agentURI` → `GET /agents/:id/card`.

## Флоу 4 — Прогон агента (ядро)

`POST /agents/:id/run` переводит агента в **RUNNING**, и он живёт в фоне: супервизор каждые 4 с забирает раунды его секторов, по которым у него ещё нет решения, и разбирает их пачками. `POST /agents/:id/pause` останавливает. Статус лежит в БД, поэтому переживает рестарт API. Каждый шаг стримится по SSE (`/runs/:runId/events`, `/events`).

1. **Discover** — открытые раунды по секторам мандата, без прошлого решения этого агента.
2. **Gather** — бесплатный отчёт + метрики фаундера, видимые этому агенту; при закрытых — запрос доступа.
3. **Mandate gate** — data coverage не ниже порога для risk tolerance, score ≥ minScore. Иначе PASS без вызова LLM.
4. **Spending policy** — потолок: maxTicket, доля от target, остаток дневного бюджета, баланс USDC на Arc.
5. **Decision engine** — Claude через forced tool-use (`submit_decision`) или детерминированный rules-движок. В промпте: мандат, раунд с долей и оценкой, findings, сигналы, **метрики фаундера с траекториями** и явное указание судить по наклону, а не по уровню.
6. **Execute** — `AUTONOMOUS` settle-ит сам; `ADVISORY` записывает решение с `approval: PENDING` и **не двигает деньги**.
7. **Audit** — каждое событие пишется в БД и зеркалится в HCS-топик.

**Рой**: `POST /rounds/:id/swarm` — все агенты оценивают один раунд параллельно.

## Флоу 5 — Ревью человеком

1. `GET /decisions/pending` — предложения от advisory-агентов; на главной это очередь «Needs your approval».
2. `POST /decisions/:id/approve` — **заново прогоняет spending policy** (мандат, дневной бюджет, баланс кошелька) и проверяет, что раунд ещё `OPEN`; не прошло — 400 с причиной, денег не двигаем. Прошло — settle на Arc.
3. `POST /decisions/:id/reject` — фиксирует отказ.
4. Повторный апрув отклоняется (400), поэтому один пропозал нельзя засеттлить дважды.
5. Оба пути — автономный и через апрув — сходятся в один `SettleDecisionStep`, поэтому эскроу, аудит и `raisedUsdc` не могут разойтись.

## Флоу 6 — Жизненный цикл раунда и возврат капитала

1. `POST /rounds/:id/finalize` — target достигнут → **Funded**; deadline прошёл без target → **Failed** (инвесторы делают `refund`).
2. `POST /rounds/:id/milestones/release` — платформа отпускает транш фаундеру; последний → **Closed**.
3. `POST /rounds/:id/exit {kind, valuationUsdc, proceedsUsdc, evidenceUri}` — ликвидное событие; статус → **Exited**, пул для клеймов пополняется (плюс неразблокированный эскроу).
4. `POST /agents/:id/claim?roundId=` — агент забирает свою pro-rata долю своим ключом; сумма измеряется on-chain.
5. `GET /rounds/:id/returns` — доля, оценка входа, проценты экзита, множитель и позиция каждого инвестора (правда берётся с chain-а). `GET /rounds/:id/exits` — список событий.
6. Реверты контракта возвращаются как HTTP 409 с именем ошибки (`NotFinalizable`, `NotAuthorized`, …).

`pnpm --filter @agentipo/api demo:flow` — весь путь одной командой.

## Флоу 7 — Дашборд (apps/web)

- `/` — статус-пилюли, KPI, **очередь апрувов**, лента «Waiting for review» (состав ленты считает бэк тем же mandate gate, что и рантайм), живое обновление по SSE.
- `/rounds/:id` — lifecycle-полоса, **метрики фаундера с траекториями** (спарклайн + наклон в месяц + окно, закрытые помечены), инбокс запросов доступа, DD (score ring, coverage, radar), сигналы с бейджем провенанса, escrow-панель, майлстоуны, рой, **Returns** (доля, оценка входа, проценты, множитель, таблица клеймов), операторские действия включая **Settle exit**.
- `/agents`, `/agents/:id` — мандат, режим (⚡ autonomous / ✋ advisory), identity, Run/Pause, лента решений, claimable now, квитанции.
- `/audit` — лента с HCS-якорями.

## Что проверено и как

| Что | Как проверено | Реальный сервис? |
| --- | --- | --- |
| Контракты | 52 Foundry-теста; полный цикл на anvil с chain-id Arc | нет — локальный форк |
| Exit-модель end-to-end | раунд → рой → апрув человеком → finalize → майлстоуны → acquisition → клеймы 4.81x, реальные EVM-транзакции | да (локально) |
| Режимы агента | advisory подал предложение и не тронул деньги, автономный засеттлил; апрув прошёл, второй отклонён; reject оставил raised = 0 | да (локально) |
| Фаундерский гейтинг | публичные метрики видны, закрытые withheld; агент запросил, фаундер открыл, **другой агент по-прежнему не видит** | да (локально) |
| Growth в скоринге | три формы в сиде дали strong 97 / weak 9 / unknown | да (локально) |
| Миграции | все шесть прогнаны по одной транзакции на чистой БД | да |
| The Graph (Token API, Messari, Agent0) | код по актуальным схемам; не гонялся против живых API | нет — нет ключей |
| Claude decision engine | код; не запускался | нет — нет ключа |
| HCS, ERC-8004, Circle wallets, Hedera-аккаунты, x402 на Blocky402 | код; не запускался | нет |

Переключение на реальные сети — только ключами в `.env` (`docs/sponsor-setup.md`); `GET /health` показывает, что включено.

## Что не сделано / открытые пункты

- Деплой на Arc testnet, Hedera testnet, прогон Graph с ключами, Claude — ждёт ключей.
- ERC-8004: `agentURI` должен быть публично доступен (туннель) для индексации сабграфом.
- «Contract» как exit трактуется как разовая выплата; контрактный выкуп по графику не реализован.
- Числа в сиде — testnet-номиналы; для демо нужны правдоподобные суммы.
- Per-round share в spending policy считается от target на каждое решение, а не кумулятивно.
- Опциональные треки не начаты: Bazantic MCP-обёртка, ENSv2 неймспейсы, 1inch Aqua.
- Видео и презентация.
