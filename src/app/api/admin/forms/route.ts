import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { DEPARTMENTS, type Department } from "@/lib/applicationForms";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";

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
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("application_form_templates")
      .select("id, name, open_at, close_at, optional_personal_questions, department_questions")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const body = await req.json();
    const {
      id,
      name,
      openAt,
      closeAt,
      optionalPersonalQuestions,
      departmentQuestions,
      illustrations,
      classOptions,
    } = body || {};

    if (!name || !openAt || !closeAt) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const optionalQs = Array.from({ length: 5 }).map((_, i) => String(optionalPersonalQuestions?.[i] ?? ""));
    const deptQs = normalizeDepartmentQuestions(departmentQuestions);
    const classOpts = Array.isArray(classOptions) ? (classOptions as unknown[]).map(String).filter(Boolean) : [];

    const openIso = new Date(String(openAt)).toISOString();
    const closeIso = new Date(String(closeAt)).toISOString();

    const payload = {
      id: id ? String(id) : undefined,
      name: String(name),
      open_at: openIso,
      close_at: closeIso,
      optional_personal_questions: optionalQs,
      department_questions: deptQs,
      illustrations: Array.isArray(illustrations) ? illustrations : [],
      class_options: classOpts,
    };

    // Upsert by id when provided (client uses same endpoint for create/edit)
    if (id) {
      const { data, error } = await supabaseAdmin
        .from("application_form_templates")
        .update({
          name: payload.name,
          open_at: payload.open_at,
          close_at: payload.close_at,
          optional_personal_questions: payload.optional_personal_questions,
          department_questions: payload.department_questions,
          illustrations: payload.illustrations,
          class_options: payload.class_options,
        })
        .eq("id", String(id))
        .select("*")
        .single();

      if (error) throw error;

      // Record history snapshot (fire-and-forget; never block the response)
      supabaseAdmin
        .from("application_form_template_history")
        .insert({ template_id: data.id, action: "updated", snapshot: data })
        .then(({ error: histErr }) => {
          if (histErr) console.warn("History insert failed:", histErr.message);
        });

      return NextResponse.json({ success: true, data });
    }

    const { data, error } = await supabaseAdmin
      .from("application_form_templates")
      .insert({
        name: payload.name,
        open_at: payload.open_at,
        close_at: payload.close_at,
        optional_personal_questions: payload.optional_personal_questions,
        department_questions: payload.department_questions,
        illustrations: payload.illustrations,
        class_options: payload.class_options,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Record history snapshot (fire-and-forget; never block the response)
    supabaseAdmin
      .from("application_form_template_history")
      .insert({ template_id: data.id, action: "created", snapshot: data })
      .then(({ error: histErr }) => {
        if (histErr) console.warn("History insert failed:", histErr.message);
      });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

