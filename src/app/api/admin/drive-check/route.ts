import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { checkGoogleDriveConnection } from "@/lib/google-drive";

export async function GET(req: Request) {
  const authError = assertAdminRequest(req);
  if (authError) return authError;

  const result = await checkGoogleDriveConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
