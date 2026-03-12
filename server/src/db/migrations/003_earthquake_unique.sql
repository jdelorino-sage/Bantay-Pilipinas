-- Add unique constraint for earthquake deduplication
-- Prevents duplicate entries from overlapping PHIVOLCS + USGS scrapes
CREATE UNIQUE INDEX IF NOT EXISTS idx_earthquakes_dedup
  ON earthquakes (magnitude, lat, lon, occurred_at, source);
