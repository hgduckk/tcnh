# Supabase Setup Guide

This project uses Supabase for multiple features:
1. **Blog Comment System** - Realtime comments with AI moderation
2. **A80 Message System** - Vietnamese flag pixel display with student messages
3. **Content Management** - Achievements, activities, partners, and structure departments managed from `/admin`

Follow these steps to set up the complete database system.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be created (takes about 2-3 minutes)
3. Note down your project URL and anon public key from the API settings

## 2. Set up Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

## 3. Create Database Tables

In your Supabase dashboard, go to the SQL Editor and run this SQL:

```sql
-- Comments table schema for Blog section
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions table for A80 page (Vietnamese flag messages)
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  student_id TEXT,
  class_name TEXT,
  faculty TEXT,
  email TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX submissions_created_at_idx ON submissions(created_at DESC);
CREATE INDEX submissions_is_anonymous_idx ON submissions(is_anonymous);

-- Enable Row Level Security (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policies for comments table
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Policies for submissions table
CREATE POLICY "Allow public read access" ON submissions
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON submissions
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for submission images
INSERT INTO storage.buckets (id, name, public) VALUES ('submission-images', 'submission-images', true);

-- Storage policies
CREATE POLICY "Allow public upload" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'submission-images');
CREATE POLICY "Allow public read" ON storage.objects 
  FOR SELECT USING (bucket_id = 'submission-images');

-- Enable realtime for tables
ALTER publication supabase_realtime ADD TABLE comments;
ALTER publication supabase_realtime ADD TABLE submissions;
```

For the current website content management features, also run the schema in [supabase-schema.sql](supabase-schema.sql).

If you already have an older database deployed, run the upgrade migration in [docs/sql/2026-04-08_remove-google-legacy-columns.sql](docs/sql/2026-04-08_remove-google-legacy-columns.sql) before deploying the latest code. This removes legacy Google Drive and Google Sheets columns that are no longer used by the app.

Minimum extra resources required by the current codebase:

1. Tables:
  - `achievements`
  - `activities`
  - `partners`
  - `structure_departments`
2. Public Storage buckets:
  - `home-images`
  - `submission-images`
  - `application-form-images`
  - `application-form-photos`
  - `achievements`
  - `activities`
  - `partners`
  - `structure`

Create the buckets in Supabase Storage UI, or run:

```sql
insert into storage.buckets (id, name, public)
values
  ('home-images', 'home-images', true),
  ('submission-images', 'submission-images', true),
  ('application-form-images', 'application-form-images', true),
  ('application-form-photos', 'application-form-photos', true),
  ('achievements', 'achievements', true),
  ('activities', 'activities', true),
  ('partners', 'partners', true),
  ('structure', 'structure', true)
on conflict (id) do nothing;
```

Image storage layout used by the app:

1. `home-images`: `banner/...` or `intro/...`
2. `submission-images`: `timestamp-random.webp`
3. `application-form-images`: `slot/timestamp-uuid.webp`
4. `application-form-photos`: `templateId/timestamp-uuid.webp`
5. `achievements`: `achievementId/image.webp`
6. `activities`: `activityId/image-0.webp`, `image-1.webp`, ...
7. `partners`: `partnerId/logo.webp`
8. `structure`: `departmentId/image-0.webp`, `image-1.webp`, ...

## 3.1 Upgrade Existing Projects

If your Supabase project was created before the Google Drive and Google Sheets cleanup, apply this order:

1. Run the latest base schema from [supabase-schema.sql](supabase-schema.sql) if those tables do not exist yet.
2. Run the upgrade migration in [docs/sql/2026-04-08_remove-google-legacy-columns.sql](docs/sql/2026-04-08_remove-google-legacy-columns.sql).
3. Create any missing storage buckets listed above.
4. Redeploy the app with the current Supabase-only environment variables.

The current runtime no longer reads or writes any Google Drive or Google Sheets settings.

## 4. Test the System

### Blog Comments:
1. Start your development server: `npm run dev`
2. Go to the blog page at `/blog`
3. Try posting a comment (both anonymous and with name)
4. Try replying to comments
5. Open the page in multiple tabs to see realtime updates

### A80 Message System:
1. Go to the A80 page at `/a80`
2. Click the floating message button in the bottom-right
3. Try submitting both anonymous and named messages
4. Watch the Vietnamese flag display update with new pixels
5. Test image uploads (optional feature)
6. Visit `/admin-a80` to manage submissions and export data

## Features

### ✅ **Realtime Comments**
- Comments appear instantly without page refresh
- Live updates when other users post comments
- Nested replies with proper threading

### ✅ **Anonymous Support**
- Users can choose to post anonymously
- Anonymous comments show "Ẩn danh" with a "?" avatar
- Actual names are still stored for moderation purposes

### ✅ **AI Content Moderation**
- All comments go through AI moderation before posting
- Inappropriate content is blocked automatically
- Safe comments are posted immediately

### ✅ **Threaded Replies**
- Users can reply to any comment
- Replies are visually nested and indented
- Chronological ordering (newest comments first, oldest replies first)

### ✅ **Responsive Design**
- Works on desktop and mobile
- Clean, modern UI with timestamps
- Loading states and error handling

## Database Structure

The comments table has the following columns:

- `id`: UUID primary key
- `name`: User's name (nullable for anonymous users)  
- `comment`: The comment text (required)
- `parent_id`: UUID reference to parent comment (for replies)
- `is_anonymous`: Boolean flag for anonymous comments
- `avatar`: URL to user's avatar (optional)
- `created_at`: Timestamp when comment was created

## How it Works

1. **User submits comment** → Form validation → AI moderation
2. **If safe** → Insert into Supabase → Realtime notification to all users
3. **If unsafe** → Show error message with reason
4. **Realtime updates** → All connected users see new comments instantly
5. **Tree structure** → Comments are organized hierarchically with replies

The system is production-ready and will scale with your user base!