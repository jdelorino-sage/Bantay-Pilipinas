-- Weather advisories (LPAs, monsoon, ITCZ, shearline, etc.)
CREATE TABLE IF NOT EXISTS weather_advisories (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(20) NOT NULL DEFAULT 'general',
  title VARCHAR(200) NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  affected_areas JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_weather_advisories_active ON weather_advisories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_weather_advisories_type ON weather_advisories(type);
