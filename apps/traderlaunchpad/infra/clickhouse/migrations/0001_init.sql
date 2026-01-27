-- Base ClickHouse schema bootstrap (idempotent).
-- Notes:
-- - Database name is controlled by the runner (CLICKHOUSE_DB).
-- - This migration assumes the runner sets --database to CLICKHOUSE_DB.

CREATE TABLE IF NOT EXISTS schema_migrations (
  name String,
  applied_at DateTime DEFAULT now()
) ENGINE = MergeTree ORDER BY (name);

