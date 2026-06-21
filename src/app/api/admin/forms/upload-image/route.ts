import { NextResponse } from "next/server";
import { type IllustrationSlot } from "@/lib/applicationForms";
import { assertAdminRequest } from "@/lib/adminAuth";
import { serializeError } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import sharp from "sharp";
import { randomUUID } from "crypto";

const FORM_ILLUSTRATIONS_BUCKET = "application-form-images";

async function ensureFormIllustrationsBucket() {
  if (!supabaseAdmin) return;

  const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(FORM_ILLUSTRATIONS_BUCKET);
  if (!getBucketError && bucket) return;

  const missingBucket = getBucketError && /not\s*found|does\s*not\s*exist/i.test(getBucketError.message);
  if (getBucketError && !missingBucket) throw getBucketError;

  const { error: createBucketError } = await supabaseAdmin.storage.createBucket(FORM_ILLUSTRATIONS_BUCKET, {
    public: true,
    fileSizeLimit: "8MB",
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  });

  if (createBucketError && !/already\s*exists|duplicate/i.test(createBucketError.message)) {
    throw createBucketError;
  }
}

function normalizeSlot(input: string): IllustrationSlot {
  const v = (input || "").toLowerCase();
  if (v === "hero" || v === "personal" || v === "department" || v === "footer") return v as IllustrationSlot;
  return "hero";
}

export async function POST(req: Request) {
  try {
    const authError = assertAdminRequest(req);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: "Supabase admin client not configured." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const slotRaw = formData.get("slot");
    const titleRaw = formData.get("title");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "Missing file." }, { status: 400 });
    }

    const slot = normalizeSlot(String(slotRaw ?? "hero"));
    const title = String(titleRaw ?? file.name ?? "image");

    await ensureFormIllustrationsBucket();

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const webpBuffer = await sharp(inputBuffer).webp({ quality: 82 }).toBuffer();

    const objectPath = `${slot}/${Date.now()}-${randomUUID()}.webp`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(FORM_ILLUSTRATIONS_BUCKET)
      .upload(objectPath, webpBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ success: false, message: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(FORM_ILLUSTRATIONS_BUCKET)
      .getPublicUrl(objectPath);

    const imageId = randomUUID();

    return NextResponse.json({
      success: true,
      image: {
        id: imageId,
        title,
        slot,
        url: publicUrlData?.publicUrl || "",
      },
    });
  } catch (e) {
    return NextResponse.json({ success: false, message: serializeError(e) }, { status: 500 });
  }
}

