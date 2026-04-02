import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { isUuid } from "@/lib/activities";
import sharp from "sharp";
import { serializeError } from "@/lib/utils";
import { randomUUID } from "crypto";

export const metadata = {
  name: "Upload Activity Images",
  description: "Upload activity images to Supabase Storage (converts to WebP)",
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
    const files = formData.getAll("files") as File[];
    const providedId = formData.get("activityId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Ignore stale client IDs that are not valid UUIDs.
    const activityId = isUuid(providedId) ? providedId : randomUUID();

    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

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
        continue; // Skip this file and continue with the next
      }

      // Construct storage path (with index and .webp extension)
      const objectPath = `${activityId}/image-${i}.webp`;
      const contentType = "image/webp";

      // Upload to Supabase Storage with upsert (overwrites if exists)
      const { error: uploadError } = await supabaseAdmin.storage
        .from("activities")
        .upload(objectPath, webpBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        continue; // Skip this file and continue with the next
      }

      // Get public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("activities")
        .getPublicUrl(objectPath);

      const imageUrl = publicUrlData?.publicUrl;
      if (imageUrl) {
        uploadedUrls.push(imageUrl);
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any images" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        activityId,
        imageUrls: uploadedUrls,
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
