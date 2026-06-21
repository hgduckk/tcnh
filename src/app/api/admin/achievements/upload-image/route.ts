import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { isUuid } from "@/lib/achievements";
import sharp from "sharp";
import { serializeError } from "@/lib/utils";
import { randomUUID } from "crypto";

export const metadata = {
  name: "Upload Achievement Image",
  description: "Upload achievement image to Supabase Storage (converts to WebP)",
};

export async function POST(request: Request) {
  try {
    // Check admin auth
    const authError = assertAdminRequest(request);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const providedId = formData.get("achievementId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Ignore stale client IDs that are not valid UUIDs.
    const achievementId = isUuid(providedId) ? providedId : randomUUID();

    // Read file as buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Convert to WebP using sharp
    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(uint8Array)
        .webp({ quality: 80 })
        .toBuffer();
    } catch (error) {
      console.error("Image conversion error:", error);
      return NextResponse.json(
        { error: "Failed to process image" },
        { status: 400 }
      );
    }

    // Construct storage path (with .webp extension)
    const objectPath = `${achievementId}/image.webp`;
    const contentType = "image/webp";

    // Upload to Supabase Storage with upsert (overwrites if exists)
    const { error: uploadError } = await supabaseAdmin.storage
      .from("achievements")
      .upload(objectPath, webpBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("achievements")
      .getPublicUrl(objectPath);

    const imageUrl = publicUrlData?.publicUrl || "";

    return NextResponse.json({
      success: true,
      data: {
        achievementId,
        imageUrl,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: serializeError(error) },
      { status: 500 }
    );
  }
}
