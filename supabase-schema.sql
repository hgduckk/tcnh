-- Comments table schema for Supabase
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Enable Row Level Security (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read comments
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);

-- Policy to allow anyone to insert comments
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Enable realtime for the comments table
ALTER publication supabase_realtime ADD TABLE comments;

-- Blog comments upgrade: role + moderation
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_role TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comments_author_role_check'
  ) THEN
    ALTER TABLE comments
      ADD CONSTRAINT comments_author_role_check
      CHECK (author_role IN ('user', 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_published_created_at
  ON comments(is_published, created_at DESC);

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;

CREATE POLICY "Public can view published comments" ON comments
  FOR SELECT USING (is_published = true);

CREATE POLICY "Anon can insert user comments only" ON comments
  FOR INSERT WITH CHECK (author_role = 'user' AND is_published = true);

-- Alumni testimonials for /blog
CREATE TABLE IF NOT EXISTS alumni_testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  message TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alumni_testimonials_published_order
  ON alumni_testimonials(is_published, display_order, created_at DESC);

ALTER TABLE alumni_testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published alumni testimonials" ON alumni_testimonials;
CREATE POLICY "Public can read published alumni testimonials" ON alumni_testimonials
  FOR SELECT USING (is_published = true);

CREATE OR REPLACE FUNCTION set_alumni_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alumni_testimonials_updated_at ON alumni_testimonials;
CREATE TRIGGER trg_alumni_testimonials_updated_at
BEFORE UPDATE ON alumni_testimonials
FOR EACH ROW
EXECUTE FUNCTION set_alumni_testimonials_updated_at();

-- ------------------------------------------------------------
-- Application forms (template + submissions)
-- ------------------------------------------------------------

-- Form templates configured in /admin
CREATE TABLE application_form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,

  -- When the form is visible on /apply
  open_at TIMESTAMP WITH TIME ZONE NOT NULL,
  close_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Fixed set of questions, but labels are customizable by admin.
  -- optional_personal_questions: array of 5 strings
  optional_personal_questions JSONB NOT NULL,

  -- department_questions: object mapping department => array of 3 strings
  -- Example:
  -- {
  --   "Tổ chức - Xây dựng Đoàn": ["Q1", "Q2", "Q3"],
  --   "Truyền thông - Kỹ thuật": ["Q1", "Q2", "Q3"],
  --   ...
  -- }
  department_questions JSONB NOT NULL,

  -- Illustrations uploaded in /admin
  -- [{ "id": "...", "title": "...", "slot": "hero|personal|department", "url": "https://..." }]
  illustrations JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Predefined list of class names for the Lớp dropdown in the application form
  -- e.g. ["24DT1", "24DT2", "24KT1", "24KT2", "24TT1", "24TT2"]
  class_options JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_application_form_templates_open_at ON application_form_templates(open_at);
CREATE INDEX idx_application_form_templates_close_at ON application_form_templates(close_at);

-- Applicant submissions created from templates on /apply
CREATE TABLE application_form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES application_form_templates(id) ON DELETE CASCADE,

  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Required base fields
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  class_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  email TEXT NOT NULL,
  gender TEXT NOT NULL,
  photo_url TEXT NOT NULL,

  -- Department choice
  department TEXT NOT NULL,

  -- Answers are stored by fixed indices (labels live in the template)
  -- optional_personal_answers: array of 5 strings
  optional_personal_answers JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- dept_optional_answers: array of 3 strings (for the selected department)
  dept_optional_answers JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX idx_application_form_submissions_template_id ON application_form_submissions(template_id);
CREATE INDEX idx_application_form_submissions_submitted_at ON application_form_submissions(submitted_at DESC);

-- Enable Row Level Security (service role bypasses RLS)
ALTER TABLE application_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_submissions ENABLE ROW LEVEL SECURITY;

-- Minimal policies (optional; service role bypasses these)
CREATE POLICY "Allow public read templates" ON application_form_templates
  FOR SELECT USING (true);

-- ------------------------------------------------------------
-- Admin data (settings + visits) in Supabase
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY,
  youtube_video_id TEXT NOT NULL,
  homepage_title TEXT NOT NULL,
  homepage_description TEXT NOT NULL,
  contact_form_title TEXT NOT NULL,
  contact_form_subtitle TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS home_settings (
  id INT PRIMARY KEY,
  home_banner_image TEXT NOT NULL DEFAULT '',
  home_image_one TEXT NOT NULL,
  home_image_two TEXT NOT NULL,
  home_image_three TEXT NOT NULL,
  home_youtube_url TEXT NOT NULL DEFAULT '',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE home_settings
  ALTER COLUMN home_banner_image SET DEFAULT '',
  ALTER COLUMN home_image_one SET DEFAULT '',
  ALTER COLUMN home_image_two SET DEFAULT '',
  ALTER COLUMN home_image_three SET DEFAULT '';

ALTER TABLE home_settings
  ADD COLUMN IF NOT EXISTS home_banner_image TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS home_youtube_url TEXT NOT NULL DEFAULT '';

INSERT INTO home_settings (
  id,
  home_banner_image,
  home_image_one,
  home_image_two,
  home_image_three,
  home_youtube_url
)
VALUES (1, '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_visits (
  id INT PRIMARY KEY,
  visits BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_visits ENABLE ROW LEVEL SECURITY;

-- Seed data is intentionally omitted.
-- Admin rows will be created/updated from the admin UI when needed.

-- ------------------------------------------------------------
-- Template history — snapshot saved on every create / update
-- ------------------------------------------------------------

CREATE TABLE application_form_template_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES application_form_templates(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated')),
  snapshot JSONB NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_template_history_template_id ON application_form_template_history(template_id);
CREATE INDEX idx_template_history_changed_at   ON application_form_template_history(changed_at DESC);

ALTER TABLE application_form_template_history ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Achievements content (managed in /admin, rendered in /achievements)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL DEFAULT '',
  achieved_on DATE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_achievements_published_order
  ON achievements(is_published, display_order, created_at DESC);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published achievements" ON achievements
  FOR SELECT USING (is_published = true);

CREATE OR REPLACE FUNCTION set_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_achievements_updated_at ON achievements;
CREATE TRIGGER trg_achievements_updated_at
BEFORE UPDATE ON achievements
FOR EACH ROW
EXECUTE FUNCTION set_achievements_updated_at();

-- Activities content (managed in /admin, rendered in /activities)
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  icon_url TEXT NOT NULL DEFAULT '',
  target_href TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  activity_type TEXT NOT NULL DEFAULT 'program' CHECK (activity_type IN ('category', 'program')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS activity_type TEXT NOT NULL DEFAULT 'program';

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS subtitle TEXT NOT NULL DEFAULT '';

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS icon_url TEXT NOT NULL DEFAULT '';

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS target_href TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'activities_activity_type_check'
  ) THEN
    ALTER TABLE activities
      ADD CONSTRAINT activities_activity_type_check
      CHECK (activity_type IN ('category', 'program'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activities_published_order
  ON activities(is_published, display_order, created_at DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published activities" ON activities
  FOR SELECT USING (is_published = true);

CREATE OR REPLACE FUNCTION set_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_activities_updated_at ON activities;
CREATE TRIGGER trg_activities_updated_at
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION set_activities_updated_at();

-- Youth page cards (managed in /admin Youth tab, rendered in /youth)
CREATE TABLE IF NOT EXISTS youth_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  icon_url TEXT NOT NULL DEFAULT '',
  target_href TEXT NOT NULL DEFAULT '',
  launch_status TEXT NOT NULL DEFAULT 'active' CHECK (launch_status IN ('active', 'coming_soon', 'ended')),
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_youth_items_published_order
  ON youth_items(is_published, display_order, created_at DESC);

ALTER TABLE youth_items
  ADD COLUMN IF NOT EXISTS launch_status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE youth_items
  DROP CONSTRAINT IF EXISTS youth_items_launch_status_check;

ALTER TABLE youth_items
  ADD CONSTRAINT youth_items_launch_status_check
  CHECK (launch_status IN ('active', 'coming_soon', 'ended'));

ALTER TABLE youth_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published youth items" ON youth_items
  FOR SELECT USING (is_published = true);

CREATE OR REPLACE FUNCTION set_youth_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_youth_items_updated_at ON youth_items;
CREATE TRIGGER trg_youth_items_updated_at
BEFORE UPDATE ON youth_items
FOR EACH ROW
EXECUTE FUNCTION set_youth_items_updated_at();

-- Partners/Collaborators (managed in /admin, rendered in /activities)
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partners_published_order
  ON partners(is_published, display_order, created_at DESC);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published partners" ON partners
  FOR SELECT USING (is_published = true);

CREATE OR REPLACE FUNCTION set_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partners_updated_at ON partners;
CREATE TRIGGER trg_partners_updated_at
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE FUNCTION set_partners_updated_at();

-- Structure departments (managed in /admin, rendered in /structure)
CREATE TABLE IF NOT EXISTS structure_departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_structure_departments_published_order
  ON structure_departments(is_published, display_order, created_at DESC);

ALTER TABLE structure_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published structure departments" ON structure_departments
  FOR SELECT USING (is_published = true);

CREATE OR REPLACE FUNCTION set_structure_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_structure_departments_updated_at ON structure_departments;
CREATE TRIGGER trg_structure_departments_updated_at
BEFORE UPDATE ON structure_departments
FOR EACH ROW
EXECUTE FUNCTION set_structure_departments_updated_at();

-- ------------------------------------------------------------
-- A80 submissions (managed in /youth/a80 and /admin-a80)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  student_id TEXT,
  class_name TEXT,
  faculty TEXT,
  email TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at
  ON submissions(created_at DESC);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read submissions" ON submissions;
CREATE POLICY "Public can read submissions" ON submissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert submissions" ON submissions;
CREATE POLICY "Public can insert submissions" ON submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete submissions" ON submissions;
CREATE POLICY "Public can delete submissions" ON submissions
  FOR DELETE USING (true);

-- Storage buckets used by website + admin

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('blog-testimonials', 'blog-testimonials', true, 8388608, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]),
  ('achievements', 'achievements', true, 8388608, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]),
  ('activities', 'activities', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4']::text[]),
  ('partners', 'partners', true, 8388608, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']::text[]),
  ('structure', 'structure', true, 8388608, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]),
  ('home-images', 'home-images', true, 8388608, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]),
  ('submission-images', 'submission-images', true, 8388608, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[])
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for public A80 uploads (API uses anon client key)
DROP POLICY IF EXISTS "Public can view submission images" ON storage.objects;
CREATE POLICY "Public can view submission images" ON storage.objects
  FOR SELECT USING (bucket_id = 'submission-images');

DROP POLICY IF EXISTS "Public can upload submission images" ON storage.objects;
CREATE POLICY "Public can upload submission images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'submission-images');

DROP POLICY IF EXISTS "Public can update submission images" ON storage.objects;
CREATE POLICY "Public can update submission images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'submission-images')
  WITH CHECK (bucket_id = 'submission-images');

DROP POLICY IF EXISTS "Public can delete submission images" ON storage.objects;
CREATE POLICY "Public can delete submission images" ON storage.objects
  FOR DELETE USING (bucket_id = 'submission-images');