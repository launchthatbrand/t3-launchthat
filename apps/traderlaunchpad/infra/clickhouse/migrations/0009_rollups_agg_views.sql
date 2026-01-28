-- Replace naive rollup tables (MergeTree) with AggregatingMergeTree state tables + read views.
--
-- Why:
-- - Materialized views that aggregate into MergeTree tables will APPEND a new rollup row
--   every time new 1m bars arrive inside an existing bucket (15m/1h/etc), creating
--   duplicate bucket timestamps.
-- - AggregatingMergeTree stores aggregate *states*. Queries (or views) can merge states
--   on read to produce one canonical candle per bucket without duplicates.
--
-- NOTE: We do NOT preserve existing rollup data (per product decision).

-- Drop old rollup MVs + tables/views if they exist.
DROP TABLE IF EXISTS mv_candles_5m;
DROP TABLE IF EXISTS mv_candles_15m;
DROP TABLE IF EXISTS mv_candles_30m;
DROP TABLE IF EXISTS mv_candles_1h;
DROP TABLE IF EXISTS mv_candles_4h;
DROP TABLE IF EXISTS mv_candles_1d;

DROP TABLE IF EXISTS candles_5m;
DROP TABLE IF EXISTS candles_15m;
DROP TABLE IF EXISTS candles_30m;
DROP TABLE IF EXISTS candles_1h;
DROP TABLE IF EXISTS candles_4h;
DROP TABLE IF EXISTS candles_1d;

DROP VIEW IF EXISTS candles_5m;
DROP VIEW IF EXISTS candles_15m;
DROP VIEW IF EXISTS candles_30m;
DROP VIEW IF EXISTS candles_1h;
DROP VIEW IF EXISTS candles_4h;
DROP VIEW IF EXISTS candles_1d;

DROP TABLE IF EXISTS mv_candles_5m_state;
DROP TABLE IF EXISTS mv_candles_15m_state;
DROP TABLE IF EXISTS mv_candles_30m_state;
DROP TABLE IF EXISTS mv_candles_1h_state;
DROP TABLE IF EXISTS mv_candles_4h_state;
DROP TABLE IF EXISTS mv_candles_1d_state;

DROP TABLE IF EXISTS candles_5m_state;
DROP TABLE IF EXISTS candles_15m_state;
DROP TABLE IF EXISTS candles_30m_state;
DROP TABLE IF EXISTS candles_1h_state;
DROP TABLE IF EXISTS candles_4h_state;
DROP TABLE IF EXISTS candles_1d_state;

-- Helper: common state schema (repeated because ClickHouse doesn't support "table macros").

-- 5m
CREATE TABLE IF NOT EXISTS candles_5m_state (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open_state   AggregateFunction(argMin, Float64, DateTime64(3, 'UTC')),
  high_state   AggregateFunction(max, Float64),
  low_state    AggregateFunction(min, Float64),
  close_state  AggregateFunction(argMax, Float64, DateTime64(3, 'UTC')),
  volume_state AggregateFunction(sum, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_5m_state
TO candles_5m_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 5 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)  AS open_state,
  maxState(high)                   AS high_state,
  minState(low)                    AS low_state,
  argMaxState(close, candles_1m.ts) AS close_state,
  sumState(volume)                 AS volume_state
FROM candles_1m
GROUP BY
  sourceKey,
  tradableInstrumentId,
  symbol,
  ts;

CREATE VIEW IF NOT EXISTS candles_5m AS
SELECT
  sourceKey,
  tradableInstrumentId,
  any(symbol) AS symbol,
  ts,
  argMinMerge(open_state)   AS open,
  maxMerge(high_state)      AS high,
  minMerge(low_state)       AS low,
  argMaxMerge(close_state)  AS close,
  sumMerge(volume_state)    AS volume
FROM candles_5m_state
GROUP BY sourceKey, tradableInstrumentId, ts;

-- 15m
CREATE TABLE IF NOT EXISTS candles_15m_state (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open_state   AggregateFunction(argMin, Float64, DateTime64(3, 'UTC')),
  high_state   AggregateFunction(max, Float64),
  low_state    AggregateFunction(min, Float64),
  close_state  AggregateFunction(argMax, Float64, DateTime64(3, 'UTC')),
  volume_state AggregateFunction(sum, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_15m_state
TO candles_15m_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 15 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)  AS open_state,
  maxState(high)                   AS high_state,
  minState(low)                    AS low_state,
  argMaxState(close, candles_1m.ts) AS close_state,
  sumState(volume)                 AS volume_state
FROM candles_1m
GROUP BY
  sourceKey,
  tradableInstrumentId,
  symbol,
  ts;

CREATE VIEW IF NOT EXISTS candles_15m AS
SELECT
  sourceKey,
  tradableInstrumentId,
  any(symbol) AS symbol,
  ts,
  argMinMerge(open_state)   AS open,
  maxMerge(high_state)      AS high,
  minMerge(low_state)       AS low,
  argMaxMerge(close_state)  AS close,
  sumMerge(volume_state)    AS volume
FROM candles_15m_state
GROUP BY sourceKey, tradableInstrumentId, ts;

-- 30m
CREATE TABLE IF NOT EXISTS candles_30m_state (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open_state   AggregateFunction(argMin, Float64, DateTime64(3, 'UTC')),
  high_state   AggregateFunction(max, Float64),
  low_state    AggregateFunction(min, Float64),
  close_state  AggregateFunction(argMax, Float64, DateTime64(3, 'UTC')),
  volume_state AggregateFunction(sum, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_30m_state
TO candles_30m_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 30 MINUTE) AS ts,
  argMinState(open, candles_1m.ts)  AS open_state,
  maxState(high)                   AS high_state,
  minState(low)                    AS low_state,
  argMaxState(close, candles_1m.ts) AS close_state,
  sumState(volume)                 AS volume_state
FROM candles_1m
GROUP BY
  sourceKey,
  tradableInstrumentId,
  symbol,
  ts;

CREATE VIEW IF NOT EXISTS candles_30m AS
SELECT
  sourceKey,
  tradableInstrumentId,
  any(symbol) AS symbol,
  ts,
  argMinMerge(open_state)   AS open,
  maxMerge(high_state)      AS high,
  minMerge(low_state)       AS low,
  argMaxMerge(close_state)  AS close,
  sumMerge(volume_state)    AS volume
FROM candles_30m_state
GROUP BY sourceKey, tradableInstrumentId, ts;

-- 1h
CREATE TABLE IF NOT EXISTS candles_1h_state (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open_state   AggregateFunction(argMin, Float64, DateTime64(3, 'UTC')),
  high_state   AggregateFunction(max, Float64),
  low_state    AggregateFunction(min, Float64),
  close_state  AggregateFunction(argMax, Float64, DateTime64(3, 'UTC')),
  volume_state AggregateFunction(sum, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1h_state
TO candles_1h_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 1 HOUR) AS ts,
  argMinState(open, candles_1m.ts)  AS open_state,
  maxState(high)                   AS high_state,
  minState(low)                    AS low_state,
  argMaxState(close, candles_1m.ts) AS close_state,
  sumState(volume)                 AS volume_state
FROM candles_1m
GROUP BY
  sourceKey,
  tradableInstrumentId,
  symbol,
  ts;

CREATE VIEW IF NOT EXISTS candles_1h AS
SELECT
  sourceKey,
  tradableInstrumentId,
  any(symbol) AS symbol,
  ts,
  argMinMerge(open_state)   AS open,
  maxMerge(high_state)      AS high,
  minMerge(low_state)       AS low,
  argMaxMerge(close_state)  AS close,
  sumMerge(volume_state)    AS volume
FROM candles_1h_state
GROUP BY sourceKey, tradableInstrumentId, ts;

-- 4h
CREATE TABLE IF NOT EXISTS candles_4h_state (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open_state   AggregateFunction(argMin, Float64, DateTime64(3, 'UTC')),
  high_state   AggregateFunction(max, Float64),
  low_state    AggregateFunction(min, Float64),
  close_state  AggregateFunction(argMax, Float64, DateTime64(3, 'UTC')),
  volume_state AggregateFunction(sum, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_4h_state
TO candles_4h_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 4 HOUR) AS ts,
  argMinState(open, candles_1m.ts)  AS open_state,
  maxState(high)                   AS high_state,
  minState(low)                    AS low_state,
  argMaxState(close, candles_1m.ts) AS close_state,
  sumState(volume)                 AS volume_state
FROM candles_1m
GROUP BY
  sourceKey,
  tradableInstrumentId,
  symbol,
  ts;

CREATE VIEW IF NOT EXISTS candles_4h AS
SELECT
  sourceKey,
  tradableInstrumentId,
  any(symbol) AS symbol,
  ts,
  argMinMerge(open_state)   AS open,
  maxMerge(high_state)      AS high,
  minMerge(low_state)       AS low,
  argMaxMerge(close_state)  AS close,
  sumMerge(volume_state)    AS volume
FROM candles_4h_state
GROUP BY sourceKey, tradableInstrumentId, ts;

-- 1d
CREATE TABLE IF NOT EXISTS candles_1d_state (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open_state   AggregateFunction(argMin, Float64, DateTime64(3, 'UTC')),
  high_state   AggregateFunction(max, Float64),
  low_state    AggregateFunction(min, Float64),
  close_state  AggregateFunction(argMax, Float64, DateTime64(3, 'UTC')),
  volume_state AggregateFunction(sum, Float64)
)
ENGINE = AggregatingMergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_1d_state
TO candles_1d_state
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 1 DAY) AS ts,
  argMinState(open, candles_1m.ts)  AS open_state,
  maxState(high)                   AS high_state,
  minState(low)                    AS low_state,
  argMaxState(close, candles_1m.ts) AS close_state,
  sumState(volume)                 AS volume_state
FROM candles_1m
GROUP BY
  sourceKey,
  tradableInstrumentId,
  symbol,
  ts;

CREATE VIEW IF NOT EXISTS candles_1d AS
SELECT
  sourceKey,
  tradableInstrumentId,
  any(symbol) AS symbol,
  ts,
  argMinMerge(open_state)   AS open,
  maxMerge(high_state)      AS high,
  minMerge(low_state)       AS low,
  argMaxMerge(close_state)  AS close,
  sumMerge(volume_state)    AS volume
FROM candles_1d_state
GROUP BY sourceKey, tradableInstrumentId, ts;

