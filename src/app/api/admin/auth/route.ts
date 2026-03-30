import { NextResponse } from "next/server";
import { validateAdminPassword } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body?.password || "");

    const result = validateAdminPassword(password);
    if (!result.ok) {
      const status = result.message?.includes("not configured") ? 500 : 401;
      return NextResponse.json({ success: false, message: result.message }, { status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Invalid request body", error: String(error) },
      { status: 400 }
    );
  }
}
