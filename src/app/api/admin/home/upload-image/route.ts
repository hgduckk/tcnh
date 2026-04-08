import sharp from "sharp";
import { NextResponse } from "next/server";
import { assertAdminRequest } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import { serializeError } from "@/lib/utils";

const HOME_IMAGES_BUCKET = "home-images";

async function ensureHomeImagesBucket() {
  if (!supabaseAdmin) return;

  const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(HOME_IMAGES_BUCKET);

  if (!getBucketError && bucket) {
    if (!bucket.public) {
      const { error: updateBucketError } = await supabaseAdmin.storage.updateBucket(HOME_IMAGES_BUCKET, {
        public: true,
        fileSizeLimit: "8MB",
        allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
      });

      if (updateBucketError) throw updateBucketError;
    }

    return;
  }

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

    if (!["1", "2", "3", "banner"].includes(slotRaw)) {
      return NextResponse.json({ success: false, message: "slot must be one of 1, 2, 3, banner." }, { status: 400 });
    }

    await ensureHomeImagesBucket();

    const inputBuffer = new Uint8Array(await file.arrayBuffer());

    let webpBuffer: Buffer;
    try {
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();
      const originalWidth = metadata.width ?? 0;
      const originalHeight = metadata.height ?? 0;

      if (originalWidth <= 0 || originalHeight <= 0) {
        return NextResponse.json({ success: false, message: "Invalid image dimensions." }, { status: 400 });
      }

      webpBuffer = await sharp(inputBuffer)
        .webp({ quality: 84 })
        .toBuffer();
    } catch {
      return NextResponse.json({ success: false, message: "Failed to process image." }, { status: 400 });
    }

    const objectPath = slotRaw === "banner" ? "home/banner.webp" : `home/intro-${slotRaw}.webp`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(HOME_IMAGES_BUCKET)
      .upload(objectPath, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: listedFiles, error: listError } = await supabaseAdmin.storage
      .from(HOME_IMAGES_BUCKET)
      .list("home", {
        search: slotRaw === "banner" ? "banner.webp" : `intro-${slotRaw}.webp`,
        limit: 20,
      });

    if (listError) {
      return NextResponse.json(
        { success: false, message: `Upload completed but verification list failed: ${listError.message}` },
        { status: 500 }
      );
    }

    const expectedFileName = slotRaw === "banner" ? "banner.webp" : `intro-${slotRaw}.webp`;
    const uploadedExists = Array.isArray(listedFiles) && listedFiles.some((item) => item?.name === expectedFileName);

    if (!uploadedExists) {
      return NextResponse.json(
        { success: false, message: "Upload completed but file not found in bucket during verification." },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(HOME_IMAGES_BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({
      success: true,
      data: {
        slot: slotRaw,
        imageUrl: publicUrlData?.publicUrl || "",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: serializeError(error) }, { status: 500 });
  }
}
