-- Canonical M1 candle store (one dataset per broker `sourceKey`).
-- Assumes UTC-aligned bar open timestamps.

CREATE TABLE IF NOT EXISTS candles_1m (
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

