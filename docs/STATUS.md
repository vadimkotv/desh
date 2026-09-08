# AgentIPO — что реализовано и какие флоу (2026-09-08)

## Компоненты

| Компонент | Стек | Состояние |
| --- | --- | --- |
| `packages/contracts` | Foundry, Solidity 0.8.24 | `RoundEscrow` + `RevenueShare`: createRound / invest / finalize / releaseMilestone / refund / distribute / claim. 48 тестов. **Задеплоен только на локальный anvil-форк Arc**, не на Arc testnet. |
| `apps/api` | NestJS 11, Prisma 7 (Postgres), viem, @x402/*, @hiero-ledger/sdk, Anthropic SDK | 9 модулей, ports & adapters, файлы ≤100 строк, 17 unit-тестов, typecheck/lint зелёные. |
| `apps/web` | Next.js 16, React 19, Tailwind 4, SSE | Командный центр, раунд, агенты, аудит. SVG-графики без библиотек. |
| `packages/shared` | zod | Единые контракты API ↔ web, константы сетей. |

## Флоу 1 — Фаундер: раунд и data room

1. `POST /startups` — стартап: founder, treasury, token (адрес + сеть), сектор.
2. `POST /rounds` — раунд: target USDC, deadline, майлстоуны (bps), **return cap** (1.0x–5.0x). Если сконфигурирован Arc — платформенный ключ создаёт раунд в `RoundEscrow`, id сохраняется.
3. `POST /data-room/startups/:id/refresh` — сбор сигналов со всех провайдеров параллельно; каждый источник снапшотится отдельно, ошибка одного не скрывает данные других.
   - **The Graph Token API**: холдеры, top-10 концентрация, трансферы за 30 дней, уникальные отправители, стейблы в казне, доля собственного токена.
   - **Messari standardized DEX subgraph**: TVL и объём по пулам токена (один запрос для любой DEX).
   - **Agent0 / ERC-8004 subgraph**: репутация агентов, которыми владеет фаундер.
   - `DEMO_SIGNALS=true` — фикстура для офлайн-разработки, помечена `demo-fixture`.
4. `POST /due-diligence/rounds/:id/generate` — 6 evaluator'ов (distribution, activity, treasury, liquidity, reputation, traction) → findings со score/weight/verdict → composite score + **data coverage** (доля категорий, по которым были данные). Traction читается живьём из escrow.
5. `GET /due-diligence/rounds/:id` — бесплатный preview (score + summary). `GET …/premium` — **x402-gated** полный отчёт (генерируется по требованию, если ещё нет).

## Флоу 2 — Агент: создание и идентичность

1. `POST /agents` — имя, владелец, тип кошелька, **мандат** (thesis, секторы, minScore, maxTicket, доля раунда, дневной бюджет, лимит на данные, risk tolerance).
2. Провижининг: HD-ключ из мастер-мнемоники (`m/44'/60'/0'/0/i`) — один secp256k1 ключ и для Arc, и для Hedera; либо Circle developer-controlled wallet на `ARC-TESTNET`. Hedera-аккаунт создаётся оператором с автоассоциацией токенов и стартовым HBAR/USDC (если оператор сконфигурирован).
3. `POST /agents/:id/identity` — регистрация в ERC-8004 Identity Registry (Sepolia) своим ключом; `agentURI` → `GET /agents/:id/card` (registration file для Agent0-сабграфа).

## Флоу 3 — Автономный прогон агента (ядро)

`POST /agents/:id/runs` (async, `{runId}`) или `POST /agents/:id/run` (sync). Каждый шаг стримится по SSE (`/runs/:runId/events`, `/events`), история — `GET /runs`.

1. **Discover** — открытые раунды по секторам мандата (или один заданный).
2. **Buy data** — агент делает HTTP-запрос к премиум-отчёту, получает 402, подписывает Hedera `TransferTransaction` своим ключом (`@x402/hedera`), фасилитатор верифицирует и settle'ит, сервер отдаёт отчёт, квитанция привязывается к агенту; `dataPaymentTxId` попадает в решение. Spend-control клиента ограничивает платёж.
3. **Mandate gate** — детерминированные фильтры: data coverage не ниже порога для risk tolerance, score ≥ minScore. Иначе PASS без вызова LLM.
4. **Spending policy** — потолок суммы: maxTicket, доля от target, остаток дневного бюджета, баланс USDC на Arc. Ниже min ticket → WATCH.
5. **Decision engine** — Claude через forced tool-use (`submit_decision`) со структурированным вердиктом (action, amount, confidence, reasoning, keyRisks; в промпте — мандат, раунд, cap возврата, findings, сигналы, собственная ERC-8004 репутация) или детерминированный rules-движок (fallback без ключа). Вердикт повторно клампится потолком.
6. **Settle** — `USDC.approve` + `RoundEscrow.invest` на Arc (локальный ключ или Circle contract-execution), ожидание receipt, `Investment` CONFIRMED/FAILED с причиной, `raisedUsdc` раунда синхронизируется.
7. **Audit** — каждое событие (DATA_PURCHASED, DECISION_MADE, INVESTMENT_*) пишется в БД и зеркалится в HCS-топик (sequence number сохраняется).

**Рой**: `POST /rounds/:id/swarm` — все агенты оценивают один раунд параллельно; разные мандаты → разные вердикты и тикеты. В UI — таблица сравнения.

## Флоу 4 — Жизненный цикл раунда и возврат капитала (RBF)

1. `POST /rounds/:id/finalize` — target достигнут → **Funded**; deadline прошёл без target → **Failed** (инвесторы делают `refund`).
2. `POST /rounds/:id/milestones/release` — платформа отпускает транш фаундеру по расписанию bps; последний транш → **Closed**.
3. `POST /rounds/:id/distribute {amountUsdc}` — выручка заводится в раунд (не выше `raised × cap`); в демо роутер выручки — платформенный кошелёк.
4. `POST /agents/:id/claim?roundId=` — агент забирает свою pro-rata долю своим ключом; сумма измеряется on-chain (claimedOf до/после), пишется в `Investment.claimedUsdc` и аудит (RETURN_CLAIMED).
5. При достижении cap на закрытом раунде статус → **Repaid**, дальнейший distribute отклоняется.
6. `GET /rounds/:id/returns` — cap, distributed, по каждому инвестору contribution / expected / claimable / claimed (правда берётся с chain-а).
7. Реверты контракта возвращаются как HTTP 409 с именем ошибки (`NotFinalizable`, `ExceedsReturnCap`, …).

`pnpm --filter @agentipo/api demo:flow` — весь флоу 1→3→4 одной командой (раунд → волны роя → finalize → 2 майлстоуна → выручка → клеймы).

## Флоу 5 — Дашборд (apps/web)

- `/` — статус-пилюли (что live, что degraded), KPI (raised/target, invested, decisions, data purchases, returned to agents, HCS anchored), открытые раунды, **живой пайплайн** (степпер buy→gate→policy→engine→settle по SSE, с историей), рейл агентов с балансами и Run.
- `/rounds/:id` — lifecycle-полоса, DD (score ring, coverage, radar по категориям, история скоров), сигналы с бейджем провенанса (LIVE · The Graph / LIVE · Arc / FIXTURE), escrow-панель, майлстоуны, рой с таблицей расхождений, **Returns** (cap-метр, дистрибуции, таблица claim'ов), операторские действия, x402-пейволл.
- `/agents`, `/agents/:id` — мандат как бары, identity (кошелёк, Hedera, ERC-8004), Run с live-степпером, лента решений («→ up to X back»), claimable now, квитанции x402.
- `/audit` — лента с HCS-якорями.

## Что проверено и как

| Что | Как проверено | Реальный сервис? |
| --- | --- | --- |
| Контракты | 48 Foundry-тестов; полный цикл на anvil с chain-id Arc | нет — локальный форк, Arc testnet не деплоился |
| Arc settlement (invest/claim/distribute/finalize/release) | реальные EVM-транзакции на anvil через viem, receipts, sync в БД | нет — anvil |
| x402 на Hedera | настоящие `@x402/*` v2: агент офлайн подписал Hedera-транзакцию, 402 → PAYMENT-SIGNATURE → verify/settle → квитанция | нет — stub-фасилитатор, Blocky402 из облака недоступен |
| The Graph (Token API, Messari, Agent0) | код по актуальным схемам/эндпоинтам; не гонялся против живых API | нет — нет JWT/gateway key |
| Claude decision engine | код; не запускался | нет — нет ключа |
| HCS, ERC-8004, Circle wallets, Hedera-аккаунты | код; не запускался | нет |
| Пайплайн агента, рой, SSE, RBF-цикл, UI | end-to-end локально, скриншоты в `docs/screens/` | да (локально) |

Переключение на реальные сети — только ключами в `.env` (`docs/sponsor-setup.md`); `GET /health` показывает, что включено.

## Что не сделано / открытые пункты

- Деплой на Arc testnet, Hedera testnet (Blocky402), прогон Graph с ключами, Claude — ждёт ключей.
- ERC-8004: `agentURI` должен быть публично доступен (туннель) для индексации сабграфом.
- Роутер выручки на стороне стартапа (сейчас — платформенный кошелёк как stand-in).
- Per-round share в spending policy считается от target на каждое решение, а не кумулятивно по вкладу агента в раунд.
- Опциональные треки не начаты: Bazantic MCP-обёртка, ENSv2 неймспейсы, 1inch Aqua.
- Видео и презентация.
