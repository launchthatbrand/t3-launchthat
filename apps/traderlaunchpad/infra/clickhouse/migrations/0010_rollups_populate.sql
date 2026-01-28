-- Backfill AggregatingMergeTree rollups from existing candles_1m.
--
-- ClickHouse materialized views only process NEW inserts by default.
-- After switching to *_state rollups, existing candles_1m history will not appear
-- in candles_5m/15m/... views until we populate the state tables.
--
-- NOTE: Some ClickHouse builds disallow `POPULATE` together with `TO <table>`.
-- So we backfill via `INSERT INTO ... SELECT ...`, then recreate the MVs (no populate)
-- for ongoing incremental inserts.

-- Stop streaming into state tables while we repopulate.
DROP TABLE IF EXISTS mv_candles_5m_state;
DROP TABLE IF EXISTS mv_candles_15m_state;
DROP TABLE IF EXISTS mv_candles_30m_state;
DROP TABLE IF EXISTS mv_candles_1h_state;
DROP TABLE IF EXISTS mv_candles_4h_state;
DROP TABLE IF EXISTS mv_candles_1d_state;

TRUNCATE TABLE IF EXISTS candles_5m_state;
TRUNCATE TABLE IF EXISTS candles_15m_state;
TRUNCATE TABLE IF EXISTS candles_30m_state;
TRUNCATE TABLE IF EXISTS candles_1h_state;
TRUNCATE TABLE IF EXISTS candles_4h_state;
TRUNCATE TABLE IF EXISTS candles_1d_state;

-- 5m backfill
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

-- 5m incremental MV
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

-- 15m backfill
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

-- 15m incremental MV
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

-- 30m backfill
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

-- 30m incremental MV
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

-- 1h backfill
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

-- 1h incremental MV
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

-- 4h backfill
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

-- 4h incremental MV
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

-- 1d backfill
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

-- 1d incremental MV
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

