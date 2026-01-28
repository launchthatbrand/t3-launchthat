-- Rebuild rollup state tables/MVs after candles_1m swap to ReplacingMergeTree.
--
-- We do not rely on POPULATE. Instead:
-- - Truncate state tables
-- - Backfill via INSERT INTO ... SELECT ... GROUP BY bucket_ts
-- - Recreate incremental MVs (no populate)

-- Ensure no old rollup MVs exist (safety).
DROP TABLE IF EXISTS mv_candles_5m_state;
DROP TABLE IF EXISTS mv_candles_15m_state;
DROP TABLE IF EXISTS mv_candles_30m_state;
DROP TABLE IF EXISTS mv_candles_1h_state;
DROP TABLE IF EXISTS mv_candles_4h_state;
DROP TABLE IF EXISTS mv_candles_4h_state;
DROP TABLE IF EXISTS mv_candles_1d_state;

TRUNCATE TABLE IF EXISTS candles_5m_state;
TRUNCATE TABLE IF EXISTS candles_15m_state;
TRUNCATE TABLE IF EXISTS candles_30m_state;
TRUNCATE TABLE IF EXISTS candles_1h_state;
TRUNCATE TABLE IF EXISTS candles_4h_state;
TRUNCATE TABLE IF EXISTS candles_1d_state;

-- Backfill state tables from candles_1m (canonical).
INSERT INTO candles_5m_state
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 5 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

INSERT INTO candles_15m_state
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 15 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

INSERT INTO candles_30m_state
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 30 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

INSERT INTO candles_1h_state
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 1 HOUR) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

INSERT INTO candles_4h_state
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 4 HOUR) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

INSERT INTO candles_1d_state
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 1 DAY) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

-- Recreate incremental MVs.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_5m_state
TO candles_5m_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 5 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_15m_state
TO candles_15m_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 15 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_30m_state
TO candles_30m_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 30 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1h_state
TO candles_1h_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 1 HOUR) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_4h_state
TO candles_4h_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 4 HOUR) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1d_state
TO candles_1d_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 1 DAY) AS ts,
  argMinState(open, candles_1m.ts)    AS open_state,
  maxState(high)                     AS high_state,
  minState(low)                      AS low_state,
  argMaxState(close, candles_1m.ts)  AS close_state,
  sumState(volume)                   AS volume_state
FROM candles_1m
GROUP BY sourceKey, tradableInstrumentId, symbol, ts;

