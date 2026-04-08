-- ------------------------------------------------------------
-- School Map dynamic model (nodes + hotspots)
-- Date: 2026-04-08
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS school_map_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES school_map_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('overview', 'building', 'floor', 'room')),
  name TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  function_text TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  image_alt TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_map_nodes_parent
  ON school_map_nodes(parent_id);

CREATE INDEX IF NOT EXISTS idx_school_map_nodes_type_published_order
  ON school_map_nodes(node_type, is_published, display_order, created_at DESC);

-- Ensure only one overview root at logical level (optional convention)
-- Keep as app-level rule to avoid complex partial uniqueness with soft publish states.

CREATE TABLE IF NOT EXISTS school_map_hotspots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_node_id UUID NOT NULL REFERENCES school_map_nodes(id) ON DELETE CASCADE,
  target_node_id UUID REFERENCES school_map_nodes(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('navigate', 'info')),
  x_percent NUMERIC(5,2) NOT NULL,
  y_percent NUMERIC(5,2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT school_map_hotspots_x_percent_check CHECK (x_percent >= 0 AND x_percent <= 100),
  CONSTRAINT school_map_hotspots_y_percent_check CHECK (y_percent >= 0 AND y_percent <= 100),
  CONSTRAINT school_map_hotspots_action_target_check CHECK (
    (action_type = 'navigate' AND target_node_id IS NOT NULL)
    OR
    (action_type = 'info' AND length(trim(description)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_school_map_hotspots_scene_published_order
  ON school_map_hotspots(scene_node_id, is_published, display_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_map_hotspots_target
  ON school_map_hotspots(target_node_id);

ALTER TABLE school_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_map_hotspots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published school map nodes" ON school_map_nodes;
CREATE POLICY "Public can read published school map nodes" ON school_map_nodes
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public can read published school map hotspots" ON school_map_hotspots;
CREATE POLICY "Public can read published school map hotspots" ON school_map_hotspots
  FOR SELECT USING (is_published = true);

CREATE OR REPLACE FUNCTION set_school_map_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_school_map_nodes_updated_at ON school_map_nodes;
CREATE TRIGGER trg_school_map_nodes_updated_at
BEFORE UPDATE ON school_map_nodes
FOR EACH ROW
EXECUTE FUNCTION set_school_map_nodes_updated_at();

CREATE OR REPLACE FUNCTION set_school_map_hotspots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_school_map_hotspots_updated_at ON school_map_hotspots;
CREATE TRIGGER trg_school_map_hotspots_updated_at
BEFORE UPDATE ON school_map_hotspots
FOR EACH ROW
EXECUTE FUNCTION set_school_map_hotspots_updated_at();

-- Storage bucket for map images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('school-map-images', 'school-map-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
