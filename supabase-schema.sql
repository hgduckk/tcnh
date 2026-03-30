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

  -- Google Drive folder where admin uploads illustrations + applicant photos
  drive_folder_url TEXT NOT NULL,
  drive_folder_id TEXT NOT NULL,

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
  dept_optional_answers JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Google Sheets write result (primary storage is Sheets; Supabase is backup)
  sheet_write_ok BOOLEAN NOT NULL DEFAULT false,
  sheet_error TEXT
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
  google_sheet_id TEXT NOT NULL,
  google_sheet_range TEXT NOT NULL,
  google_sheet_range_contact TEXT NOT NULL,
  google_sheet_range_comments TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS admin_visits (
  id INT PRIMARY KEY,
  visits BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_visits ENABLE ROW LEVEL SECURITY;

-- Seed singleton rows
INSERT INTO admin_settings (
  id,
  youtube_video_id,
  homepage_title,
  homepage_description,
  contact_form_title,
  contact_form_subtitle,
  google_sheet_id,
  google_sheet_range,
  google_sheet_range_contact,
  google_sheet_range_comments
)
VALUES (
  1,
  'dQw4w9WgXcQ',
  'Đoàn Khoa Tài chính - Ngân hàng',
  'Cùng nhau xây dựng hành trình Thanh niên tươi sáng.',
  'Liên hệ với chúng tôi',
  'Nhập thông tin để gửi tin nhắn',
  COALESCE(current_setting('app.settings.google_sheet_id', true), 'your_google_sheet_id_here'),
  COALESCE(current_setting('app.settings.google_sheet_range', true), 'Sheet1!A:Z'),
  COALESCE(current_setting('app.settings.google_sheet_range_contact', true), 'Contact!A:D'),
  COALESCE(current_setting('app.settings.google_sheet_range_comments', true), 'Comments!A:F')
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_visits (id, visits)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

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
-- Migration helpers (run only when upgrading an existing DB)
-- ------------------------------------------------------------
-- ALTER TABLE application_form_submissions
--   ADD COLUMN IF NOT EXISTS sheet_write_ok BOOLEAN NOT NULL DEFAULT false,
--   ADD COLUMN IF NOT EXISTS sheet_error TEXT;
--
-- CREATE TABLE IF NOT EXISTS application_form_template_history (
--   ... (same as above)
-- );