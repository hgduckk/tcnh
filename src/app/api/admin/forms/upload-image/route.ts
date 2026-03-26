import { NextResponse } from "next/server";
import { extractDriveFolderId, uploadFileToDrive } from "@/lib/google-drive";
import { type IllustrationSlot } from "@/lib/applicationForms";

function checkAdmin(req: Request) {
  const headerPassword = req.headers.get("x-admin-password") || "";
  const expected = process.env.ADMIN_PASSWORD || "maiyeuquangan";
  return headerPassword === expected;
}

function normalizeSlot(input: string): IllustrationSlot {
  const v = (input || "").toLowerCase();
  if (v === "hero" || v === "personal" || v === "department" || v === "footer") return v as IllustrationSlot;
  return "hero";
}

export async function POST(req: Request) {
  try {
    if (!checkAdmin(req)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const driveFolderUrl = formData.get("driveFolderUrl");
    const slotRaw = formData.get("slot");
    const titleRaw = formData.get("title");

    if (!driveFolderUrl || typeof driveFolderUrl !== "string") {
      return NextResponse.json({ success: false, message: "Missing driveFolderUrl." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Missing file." }, { status: 400 });
    }

    const folderId = extractDriveFolderId(driveFolderUrl);
    if (!folderId) {
      return NextResponse.json({ success: false, message: "Invalid Drive folder link." }, { status: 400 });
    }

    const slot = normalizeSlot(String(slotRaw ?? "hero"));
    const title = String(titleRaw ?? file.name ?? "image");

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await uploadFileToDrive({
      folderId,
      filename: title,
      mimeType: file.type || "image/jpeg",
      buffer,
    });

    return NextResponse.json({
      success: true,
      image: {
        id: uploadRes.driveFileId,
        title,
        slot,
        url: uploadRes.url,
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: String(e) }, { status: 500 });
  }
}

