import { NextResponse } from "next/server";

export function assertAdminRequest(req: Request): NextResponse | null {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { success: false, message: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 }
    );
  }

  const provided = req.headers.get("x-admin-password") || "";
  if (provided !== expected) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function validateAdminPassword(password: string): { ok: boolean; message?: string } {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, message: "ADMIN_PASSWORD is not configured on the server." };
  }

  if (password !== expected) {
    return { ok: false, message: "Unauthorized" };
  }

  return { ok: true };
}
