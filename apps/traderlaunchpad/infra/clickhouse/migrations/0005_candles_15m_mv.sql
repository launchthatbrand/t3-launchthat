-- 15-minute derived candles from M1.
-- Creates:
-- - candles_15m table
-- - mv_candles_15m materialized view that aggregates inserts into candles_1m

CREATE TABLE IF NOT EXISTS candles_15m (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open Float64,
  high Float64,
  low  Float64,
  close Float64,
  volume Float64
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_15m
TO candles_15m
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 15 MINUTE) AS ts,
  argMin(open, ts)  AS open,
  max(high)         AS high,
  min(low)          AS low,
  argMax(close, ts) AS close,
  sum(volume)       AS volume
FROM candles_1m
GROUP BY
  sourceKey,
  tradableInstrumentId,
  symbol,
  ts;

