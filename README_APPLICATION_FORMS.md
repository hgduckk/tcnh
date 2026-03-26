# Application Forms (Templates + Submissions)

This section wires your `/admin` form builder to persist templates into **Supabase** (“supportbase”), and your `/apply` page renders the currently active template (based on `open_at`/`close_at`).

It also uploads the applicant’s required **photo** and the admin’s **illustration images** into a Google Drive folder chosen in the template builder.

## 1) Supabase tables

Your repo already contains SQL in `supabase-schema.sql`. It now includes these new tables:

- `application_form_templates`
- `application_form_submissions`

To create them, run the updated contents of `supabase-schema.sql` in Supabase SQL Editor.

## 2) Environment variables (required)

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required)
  - Used by server code to save templates + submissions and to read templates for `/apply`.

### Google Drive

This project uses a **Google service account** (not an API key) to upload files to Drive.

Set one of these credential options (any one is enough):

- `GOOGLE_SERVICE_ACCOUNT_KEY_JSON`
or
- `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
or
- `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` (path to a JSON file on the server)
or
- `GOOGLE_CLIENT_EMAIL` + `GOOGLE_PRIVATE_KEY`

Also:
- Enable **Google Drive API** for your Google Cloud project.
- Make sure the **Drive folder** entered by the admin is accessible to the service account.
- The code tries a best-effort permission update to make uploaded files readable; if that fails, you must ensure the folder/files are shared appropriately so the images render in the browser.

### Admin password (for template admin endpoints)

Server API routes check:

- `ADMIN_PASSWORD` (optional; defaults to `maiyeuquangan` if not set)

## 3) What “deploy” means

In this implementation, a template becomes visible on `/apply` automatically when:

- `open_at <= now <= close_at`

When no active template exists, `/apply` shows a countdown to the next opening (or an “ended” message if none exist).

