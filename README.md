# TCNH Web System

## 1) Overview

This is a website for Finance and Banking Club, including:

- Public pages (home, activities, achievements, rangrovietnam, blog, apply)
- Admin page for settings, form template management, and submission review
- Template-driven application form flow
- rangrovietnam submission flow with image upload and Excel export
- Supabase for submissions, comments, form images, and rangrovietnam data
- Sanity for site configuration fallback
- AI chat endpoint for advisor support

## 2) Core Stack

- Next.js 15 + React 18 + TypeScript
- Supabase (public + admin clients)
- Sanity CMS
- Genkit/Gemini for AI chat
- Tailwind + shadcn-style UI components

## 3) Project Structure (High Level)

- `src/app`: pages and API routes
- `src/components`: UI and feature components
- `src/lib`: integrations, schemas, helpers
- `src/ai`: AI flows and Genkit setup
- `src/sanity`: Sanity client/schema
- `public`: static assets

## 4) Environment Variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`

Sanity:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`

## 5) Run Commands

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`

## 6) Main Runtime Flows

### Apply Flow

- UI fetches active template from `/api/forms/active`
- User submits template-driven form
- Server action validates payload
- Photo uploads to Supabase Storage (`application-form-photos`)
- Submission writes to Supabase `application_form_submissions`

### Admin Forms Flow

- `/admin` uses password-gated API calls
- CRUD template endpoints under `/api/admin/forms`
- Optional image upload endpoint under `/api/admin/forms/upload-image`
- Submissions listed from `/api/admin/application-form-submissions`

### rangrovietnam Flow

- Public POST/GET: `/api/rangrovietnam/submissions`
- Delete by id: `/api/rangrovietnam/submissions/[id]`
- Export xlsx: `/api/rangrovietnam/export`

### Blog Comment Flow

- `submitComment` server action validates and inserts into Supabase comments
- AI moderation flow files exist, but moderation is currently disabled in action code

### Contact Flow

- `submitContactForm` validates and (optionally) persists to Supabase table if configured

## 7) Data and Integrations

- Supabase tables include comments, submissions, `application_form_templates`, `application_form_submissions`
- Sanity site config endpoint returns CMS config or fallback defaults
- Local JSON files are used for admin settings and visit metrics

## 8) Security Notes

- Never commit service account key files
- Keep service role key server-side only
- Replace default admin password in production
- Rotate any credential that was previously committed

## 9) Recommended Cleanup (To Reduce Project Size)

- Merge all setup docs into this README and delete redundant markdown files
- Remove test/debug-only pages and endpoints if not needed in production
- Remove legacy unused apply component if confirmed unused
- Remove malformed empty admin forms route artifact
- Remove unused dependencies after verification
- Remove committed credential file and rotate key immediately

## 10) Deployment Readiness Checklist

- Supabase env set and reachable
- Admin password set to secure value
- No secret files tracked in git
- Optional test routes removed or protected
- Build and typecheck pass
