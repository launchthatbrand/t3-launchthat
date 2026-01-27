-- 30-minute derived candles from M1.
-- Creates:
-- - candles_30m table
-- - mv_candles_30m materialized view that aggregates inserts into candles_1m

CREATE TABLE IF NOT EXISTS candles_30m (
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

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_candles_30m
TO candles_30m
AS
SELECT
  sourceKey,
  tradableInstrumentId,
  symbol,
  toStartOfInterval(ts, INTERVAL 30 MINUTE) AS ts,
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

