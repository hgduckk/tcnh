import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

const SCHOOL_MAP_IMAGES_BUCKET = "school-map-images";

function extensionFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function ensureBucket() {
  if (!supabaseAdmin) return;

  const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(SCHOOL_MAP_IMAGES_BUCKET);
  if (!getBucketError && bucket) return;

  const missingBucket = getBucketError && /not\s*found|does\s*not\s*exist/i.test(getBucketError.message);
  if (getBucketError && !missingBucket) throw getBucketError;

  const { error: createBucketError } = await supabaseAdmin.storage.createBucket(SCHOOL_MAP_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: "10MB",
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

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided." }, { status: 400 });
    }

    await ensureBucket();

    const refId = String(formData.get("nodeId") || randomUUID()).trim();
    const extension = extensionFromMime(String(file.type || "").toLowerCase());
    const objectPath = `${refId}/${Date.now()}-${randomUUID()}.${extension}`;

    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SCHOOL_MAP_IMAGES_BUCKET)
      .upload(objectPath, uint8Array, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(SCHOOL_MAP_IMAGES_BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: publicUrlData?.publicUrl || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: serializeError(error) }, { status: 500 });
  }
}
