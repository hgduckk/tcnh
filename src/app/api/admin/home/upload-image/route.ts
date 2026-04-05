import sharp from "sharp";
import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

const HOME_IMAGES_BUCKET = "home-images";

async function ensureHomeImagesBucket() {
  if (!supabaseAdmin) return;

  const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(HOME_IMAGES_BUCKET);

  if (!getBucketError && bucket) return;

  const missingBucket = getBucketError && /not\s*found|does\s*not\s*exist/i.test(getBucketError.message);
  if (getBucketError && !missingBucket) throw getBucketError;

  const { error: createBucketError } = await supabaseAdmin.storage.createBucket(HOME_IMAGES_BUCKET, {
    public: true,
    fileSizeLimit: "8MB",
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
    const slotRaw = String(formData.get("slot") || "").trim();

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided." }, { status: 400 });
    }

    if (!["1", "2", "3"].includes(slotRaw)) {
      return NextResponse.json({ success: false, message: "slot must be one of 1, 2, 3." }, { status: 400 });
    }

    await ensureHomeImagesBucket();

    const inputBuffer = new Uint8Array(await file.arrayBuffer());

    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(inputBuffer).webp({ quality: 84 }).toBuffer();
    } catch {
      return NextResponse.json({ success: false, message: "Failed to process image." }, { status: 400 });
    }

    const objectPath = `home/intro-${slotRaw}.webp`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(HOME_IMAGES_BUCKET)
      .upload(objectPath, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(HOME_IMAGES_BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({
      success: true,
      data: {
        slot: Number(slotRaw),
        imageUrl: publicUrlData?.publicUrl || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: serializeError(error) }, { status: 500 });
  }
}
