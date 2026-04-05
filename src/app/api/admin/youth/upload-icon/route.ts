import { randomUUID } from "crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { isUuid } from "@/lib/youth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

const YOUTH_ICONS_BUCKET = "youth-icons";

async function ensureYouthIconsBucket() {
  if (!supabaseAdmin) return;

  const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(YOUTH_ICONS_BUCKET);

  if (!getBucketError && bucket) return;

  const missingBucket = getBucketError && /not\s*found|does\s*not\s*exist/i.test(getBucketError.message);
  if (getBucketError && !missingBucket) throw getBucketError;

  const { error: createBucketError } = await supabaseAdmin.storage.createBucket(YOUTH_ICONS_BUCKET, {
    public: true,
    fileSizeLimit: "5MB",
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  });

  if (createBucketError && !/already\s*exists|duplicate/i.test(createBucketError.message)) {
    throw createBucketError;
  }
}

export async function POST(request: Request) {
  try {
    const authError = assertAdminRequest(request);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const providedId = formData.get("youthId") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided." }, { status: 400 });
    }

    await ensureYouthIconsBucket();

    const youthId = isUuid(providedId) ? providedId : randomUUID();

    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(uint8Array).webp({ quality: 82 }).toBuffer();
    } catch {
      return NextResponse.json({ success: false, message: "Failed to process image." }, { status: 400 });
    }

    const objectPath = `${youthId}/icon.webp`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(YOUTH_ICONS_BUCKET)
      .upload(objectPath, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(YOUTH_ICONS_BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({
      success: true,
      data: {
        youthId,
        iconUrl: publicUrlData?.publicUrl || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: serializeError(error) }, { status: 500 });
  }
}
