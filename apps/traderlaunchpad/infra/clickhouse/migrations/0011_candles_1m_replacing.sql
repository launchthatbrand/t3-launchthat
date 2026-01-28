-- Make candles_1m canonical by adding a version column and switching engine to ReplacingMergeTree.
--
-- Why:
-- - ClickHouse MergeTree does not enforce uniqueness, so overlapping inserts can create duplicates.
-- - We keep ingestion append-only in practice, but ReplacingMergeTree provides an extra safety net.
--
-- Notes:
-- - Rollup MVs depend on candles_1m being a TABLE, not a VIEW.
-- - We drop rollup MVs here (they will be rebuilt in the next migration).
-- - We copy existing candles_1m rows into the new table for continuity.

-- Stop rollup ingestion while swapping base table.
DROP TABLE IF EXISTS mv_candles_5m_state;
DROP TABLE IF EXISTS mv_candles_15m_state;
DROP TABLE IF EXISTS mv_candles_30m_state;
DROP TABLE IF EXISTS mv_candles_1h_state;
DROP TABLE IF EXISTS mv_candles_4h_state;
DROP TABLE IF EXISTS mv_candles_1d_state;

-- Create new canonical table.
CREATE TABLE IF NOT EXISTS candles_1m_new (
  sourceKey LowCardinality(String),
  tradableInstrumentId LowCardinality(String),
  symbol LowCardinality(String),
  ts DateTime64(3, 'UTC'),
  open Float64,
  high Float64,
  low  Float64,
  close Float64,
  volume Float64,
  ingestedAt DateTime64(3, 'UTC') DEFAULT now64(3)
)
ENGINE = ReplacingMergeTree(ingestedAt)
PARTITION BY toYYYYMM(ts)
ORDER BY (sourceKey, tradableInstrumentId, ts);

-- Best-effort copy of existing data (no need to preserve, but helps continuity).
INSERT INTO candles_1m_new (sourceKey, tradableInstrumentId, symbol, ts, open, high, low, close, volume)
SELECT sourceKey, tradableInstrumentId, symbol, ts, open, high, low, close, volume
FROM candles_1m;

-- Swap tables.
DROP TABLE IF EXISTS candles_1m_raw;
RENAME TABLE candles_1m TO candles_1m_raw, candles_1m_new TO candles_1m;

