import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { assertAdminRequest } from "@/lib/adminAuth";
import { isUuid } from "@/lib/structureDepartments";
import sharp from "sharp";
import { serializeError } from "@/lib/utils";
import { randomUUID } from "crypto";

export const metadata = {
  name: "Upload Structure Images",
  description: "Upload structure department images to Supabase Storage (converts to WebP)",
};

export async function POST(request: Request) {
  try {
    const authError = assertAdminRequest(request);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const providedId = formData.get("departmentId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const departmentId = isUuid(providedId) ? providedId : randomUUID();
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      let webpBuffer: Buffer;
      try {
        webpBuffer = await sharp(uint8Array)
          .webp({ quality: 80 })
          .toBuffer();
      } catch (error) {
        console.error("Image conversion error:", error);
        continue;
      }

      const objectPath = `${departmentId}/image-${i}.webp`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("structure")
        .upload(objectPath, webpBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        continue;
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("structure")
        .getPublicUrl(objectPath);

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
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
        departmentId,
        imageUrls: uploadedUrls,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: serializeError(error) },
      { status: 500 }
    );
  }
}
