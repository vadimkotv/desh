# Deploying AgentIPO

One box, one command, a public HTTPS link. The stack brings its own chain — a local
Arc stand-in with the escrow deployed and every wallet funded — so the demo works with
**no testnet funds and no sponsor keys**. Add keys later and the same containers go live.

## What you need

- A server with Docker (`curl -fsSL https://get.docker.com | sh`) and ports 80 + 443 open.
- A hostname pointing at it. **No domain? You do not need one**: `sslip.io` resolves
  `203-0-113-10.sslip.io` to `203.0.113.10`, and Caddy will issue a real Let's Encrypt
  certificate for it. Substitute your own IP with dashes instead of dots.

## Deploy

```bash
git clone https://github.com/vadimkotv/desh.git && cd desh
cp deploy/.env.example deploy/.env
nano deploy/.env               # set DOMAIN and ACME_EMAIL, change POSTGRES_PASSWORD
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build
```

First build takes a few minutes. Then:

- dashboard → `https://<DOMAIN>`
- API + Swagger → `https://api.<DOMAIN>/docs`
- health → `https://api.<DOMAIN>/health` shows which integrations are live

The database is migrated and seeded on first start (3 startups with deliberately
different growth curves, 4 agents including one advisory). Restarts do not re-seed.

## Driving the demo

```bash
# the whole story end to end, against the deployed stack
docker compose -f deploy/docker-compose.yml exec api pnpm demo:flow 20 140

# top up agent wallets after creating new agents through the UI
docker compose -f deploy/docker-compose.yml exec api pnpm dev:fund-agents

# one line per sponsor integration: PASS / FAIL / skip, with the key that turns it on
docker compose -f deploy/docker-compose.yml exec api pnpm verify:integrations
```

In the browser: **Run** on an agent starts it researching in the background; **Run
swarm** on a round puts every agent on it at once; advisory proposals land in *Needs
your approval* on the command center.

## Logs and teardown

```bash
docker compose -f deploy/docker-compose.yml logs -f api
docker compose -f deploy/docker-compose.yml down          # keeps data
docker compose -f deploy/docker-compose.yml down -v       # wipes chain + database
```

## Notes

- **Port 80 already taken?** Add `-f deploy/docker-compose.port443.yml` to every compose
  command. Caddy then listens on 443 only and proves ownership over TLS-ALPN instead of HTTP.

- **The chain is local.** `anvil` keeps its state in a volume, so rounds, investments
  and exits survive restarts — but it is not Arc testnet, and the UI says so. Point
  `ARC_RPC_URL` at a real RPC and set a funded `ARC_PLATFORM_PRIVATE_KEY` to change that.
- **Server-Sent Events** need `flush_interval -1` in the reverse proxy, which the
  `Caddyfile` sets. Behind a different proxy, disable response buffering for `/events`
  and `/runs/*/events` or the live pipeline will look frozen.
- **The mnemonic in `.env.example` is anvil's public test mnemonic.** It is correct for
  this local chain and must never be used for a wallet holding anything real.
