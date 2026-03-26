import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { extractDriveFolderId } from "@/lib/google-drive";
import { DEPARTMENTS, type Department } from "@/lib/applicationForms";

function checkAdmin(req: Request) {
  const headerPassword = req.headers.get("x-admin-password") || "";
  const expected = process.env.ADMIN_PASSWORD || "maiyeuquangan";
  return headerPassword === expected;
}

function normalizeDepartmentQuestions(input: any): Record<Department, string[]> {
  const out = {} as Record<Department, string[]>;
  for (const dept of DEPARTMENTS) {
    const arr = input?.[dept];
    const fixed = Array.from({ length: 3 }).map((_, i) => String(arr?.[i] ?? ""));
    out[dept] = fixed;
  }
  return out;
}

export async function GET(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }
    if (!checkAdmin(req)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("application_form_templates")
      .select("id, name, open_at, close_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }
    if (!checkAdmin(req)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      openAt,
      closeAt,
      driveFolderUrl,
      optionalPersonalQuestions,
      departmentQuestions,
      illustrations,
    } = body || {};

    if (!name || !openAt || !closeAt || !driveFolderUrl) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const folderId = extractDriveFolderId(String(driveFolderUrl));
    if (!folderId) {
      return NextResponse.json({ success: false, message: "Invalid Drive folder link." }, { status: 400 });
    }

    const optionalQs = Array.from({ length: 5 }).map((_, i) => String(optionalPersonalQuestions?.[i] ?? ""));
    const deptQs = normalizeDepartmentQuestions(departmentQuestions);

    const openIso = new Date(String(openAt)).toISOString();
    const closeIso = new Date(String(closeAt)).toISOString();

    const payload = {
      id: id ? String(id) : undefined,
      name: String(name),
      open_at: openIso,
      close_at: closeIso,
      drive_folder_url: String(driveFolderUrl),
      drive_folder_id: folderId,
      optional_personal_questions: optionalQs,
      department_questions: deptQs,
      illustrations: Array.isArray(illustrations) ? illustrations : [],
    };

    // Upsert by id when provided (client uses same endpoint for create/edit)
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("application_form_templates")
        .update({
          name: payload.name,
          open_at: payload.open_at,
          close_at: payload.close_at,
          drive_folder_url: payload.drive_folder_url,
          drive_folder_id: payload.drive_folder_id,
          optional_personal_questions: payload.optional_personal_questions,
          department_questions: payload.department_questions,
          illustrations: payload.illustrations,
        })
        .eq("id", String(id))
        .select("*")
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabaseAdmin
      .from("application_form_templates")
      .insert({
        name: payload.name,
        open_at: payload.open_at,
        close_at: payload.close_at,
        drive_folder_url: payload.drive_folder_url,
        drive_folder_id: payload.drive_folder_id,
        optional_personal_questions: payload.optional_personal_questions,
        department_questions: payload.department_questions,
        illustrations: payload.illustrations,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

