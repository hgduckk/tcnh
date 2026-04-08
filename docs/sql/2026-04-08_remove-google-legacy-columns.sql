begin;

alter table if exists public.application_form_templates
  drop column if exists drive_folder_url,
  drop column if exists drive_folder_id;

alter table if exists public.application_form_submissions
  drop column if exists sheet_write_ok,
  drop column if exists sheet_error;

alter table if exists public.admin_settings
  drop column if exists google_sheet_id,
  drop column if exists google_sheet_range,
  drop column if exists google_sheet_range_contact,
  drop column if exists google_sheet_range_comments;

commit;