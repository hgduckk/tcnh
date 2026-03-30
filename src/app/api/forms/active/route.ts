import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 1) Currently active template
    const { data: activeRows, error: activeErr } = await supabaseAdmin
      .from("application_form_templates")
      .select("*")
      .lte("open_at", nowIso)
      .gte("close_at", nowIso)
      .order("open_at", { ascending: false })
      .limit(1);

    if (activeErr) {
      return NextResponse.json(
        { success: false, message: activeErr.message },
        { status: 500 }
      );
    }

    const active = activeRows?.[0];
    if (active) {
      return NextResponse.json({
        success: true,
        status: "active",
        now: nowIso,
        template: active,
      });
    }

    // 2) Next template that will open
    const { data: nextRows, error: nextErr } = await supabaseAdmin
      .from("application_form_templates")
      .select("*")
      .gt("open_at", nowIso)
      .order("open_at", { ascending: true })
      .limit(1);

    if (nextErr) {
      return NextResponse.json(
        { success: false, message: nextErr.message },
        { status: 500 }
      );
    }

    const next = nextRows?.[0];
    if (next) {
      return NextResponse.json({
        success: true,
        status: "not_started",
        now: nowIso,
        template: next,
      });
    }

    // 3) Most recently closed template (for a nice fallback message)
    const { data: lastRows, error: lastErr } = await supabaseAdmin
      .from("application_form_templates")
      .select("*")
      .lt("close_at", nowIso)
      .order("close_at", { ascending: false })
      .limit(1);

    if (lastErr) {
      return NextResponse.json(
        { success: false, message: lastErr.message },
        { status: 500 }
      );
    }

    const last = lastRows?.[0];
    return NextResponse.json({
      success: true,
      status: "ended",
      now: nowIso,
      template: last ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: serializeError(error) },
      { status: 500 }
    );
  }
}

