## ClickHouse ops (via SSH)

TraderLaunchpad manages the ClickHouse droplet using **SQL migrations applied over SSH**.
This keeps ClickHouse ports private (no public 8123/9000 required) and makes schema changes
auditable and reproducible.

### Environment variables

These are loaded from `apps/traderlaunchpad/.env` via `dotenv -e .env -- ...`:

- **`CLICKHOUSE_SSH_HOST`**: Droplet IP/hostname (required)
- **`CLICKHOUSE_SSH_USER`**: SSH user (default: `root`)
- **`CLICKHOUSE_SSH_IDENTITY_FILE`**: Path to SSH private key (optional)
- **`CLICKHOUSE_SSH_PORT`**: SSH port (optional, default: `22`)
- **`CLICKHOUSE_DB`**: Database name (default: `traderlaunchpad`)
- **`CLICKHOUSE_USER`**: ClickHouse user (default: `default`)
- **`CLICKHOUSE_PASSWORD`**: ClickHouse password (required if auth enabled)

### Commands

- **Run migrations**

```bash
pnpm -C apps/traderlaunchpad clickhouse:migrate --verbose
```

- **Run a one-off query**

```bash
pnpm -C apps/traderlaunchpad clickhouse:query "SELECT version()"
```

### Migrations

Migrations live in `apps/traderlaunchpad/infra/clickhouse/migrations/` and are applied once,
tracked in `CLICKHOUSE_DB.schema_migrations`.
