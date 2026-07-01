"use server";

import { z } from 'zod';
// import { moderateBlogComments } from '@/ai/flows/moderate-blog-comments';
// import { analyzeApplication } from '@/ai/flows/analyze-application';
import { ContactFormSchema, CommentFormSchema, ApplicationFormSubmissionStrictSchema, type ContactFormState, type CommentFormState, type ApplicationFormState } from '@/lib/definitions';
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';

const APPLICATION_PHOTOS_BUCKET = 'application-form-photos';

async function ensureApplicationPhotosBucket() {
  if (!supabaseAdmin) return;

  const { data: bucket, error: getBucketError } = await supabaseAdmin.storage.getBucket(APPLICATION_PHOTOS_BUCKET);
  if (!getBucketError && bucket) return;

  const missingBucket = getBucketError && /not\s*found|does\s*not\s*exist/i.test(getBucketError.message);
  if (getBucketError && !missingBucket) throw getBucketError;

  const { error: createBucketError } = await supabaseAdmin.storage.createBucket(APPLICATION_PHOTOS_BUCKET, {
    public: true,
    fileSizeLimit: '8MB',
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  });

  if (createBucketError && !/already\s*exists|duplicate/i.test(createBucketError.message)) {
    throw createBucketError;
  }
}

async function uploadApplicantPhoto(photoFile: File, templateId: string): Promise<string> {
  if (!supabaseAdmin) return '';

  const inputBuffer = Buffer.from(await photoFile.arrayBuffer());
  const { default: sharp } = await import('sharp');
  const webpBuffer = await sharp(inputBuffer).webp({ quality: 82 }).toBuffer();

  await ensureApplicationPhotosBucket();

  const objectPath = `${templateId}/${Date.now()}-${randomUUID()}.webp`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(APPLICATION_PHOTOS_BUCKET)
    .upload(objectPath, webpBuffer, {
      contentType: 'image/webp',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(APPLICATION_PHOTOS_BUCKET)
    .getPublicUrl(objectPath);

  return publicUrlData?.publicUrl || '';
}

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const validatedFields = ContactFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      issues: Object.values(validatedFields.error.flatten().fieldErrors).flat().filter(Boolean),
      fields: {
        name: formData.get('name')?.toString() ?? '',
        email: formData.get('email')?.toString() ?? '',
        message: formData.get('message')?.toString() ?? '',
      }
    };
  }

  const { name, email, message } = validatedFields.data;

  if (supabaseAdmin) {
    try {
      // Optional persistence table for contact messages if it exists in Supabase.
      await supabaseAdmin.from('contact_messages').insert({ name, email, message });
      return { message: `Thank you, ${name}! Your message has been received and saved.` };
    } catch (error) {
      console.warn('Could not persist contact message to Supabase:', error);
    }
  }

  return { message: `Thank you, ${name}! Your message has been received.` };
}

export async function submitComment(
  prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const rawData = {
    name: formData.get('name')?.toString() || null,
    comment: formData.get('comment')?.toString() || '',
    parentId: formData.get('parentId')?.toString() || null,
    isAnonymous: formData.get('isAnonymous') === 'true',
  };

  const validatedFields = CommentFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed.",
      issues: Object.values(validatedFields.error.flatten().fieldErrors).flat().filter(Boolean),
    };
  }

  const { name, comment, parentId, isAnonymous } = validatedFields.data;

  try {
    if (!supabase) {
      return {
        message: "Không thể lưu bình luận. Supabase chưa được cấu hình.",
        isSafe: false,
        reason: "Supabase client is null.",
      };
    }

    // AI content moderation disabled
    // const moderationResult = await moderateBlogComments({ comment });

    // if (!moderationResult.isSafe) {
    //   return {
    //     message: "Bình luận không thể đăng do vi phạm quy định cộng đồng.",
    //     isSafe: false,
    //     reason: moderationResult.reason || "Nội dung không phù hợp với tiêu chuẩn cộng đồng.",
    //   };
    // }

    // Insert comment into Supabase
    const { error } = await supabase.from("comments").insert({
      name: isAnonymous ? null : name,
      comment,
      parent_id: parentId,
      is_anonymous: isAnonymous,
      avatar: null,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return {
        message: "Không thể lưu bình luận. Vui lòng thử lại.",
        isSafe: false,
        reason: error.message,
      };
    }

    return {
      message: "Bình luận của bạn đã được đăng thành công!",
      isSafe: true,
    };
  } catch (error) {
    console.error("Error processing comment:", error);
    return {
      message: "Đã có lỗi xảy ra. Vui lòng thử lại.",
      isSafe: false,
    };
  }
}

export async function submitApplication(
  prevState: ApplicationFormState,
  formData: FormData
): Promise<ApplicationFormState> {
  try {
    const validatedFields = ApplicationFormSubmissionStrictSchema.safeParse({
      templateId: formData.get('templateId')?.toString() || '',
      fullName: formData.get('fullName')?.toString() || '',
      birthDate: formData.get('birthDate')?.toString() || '',
      className: formData.get('className')?.toString() || '',
      studentId: formData.get('studentId')?.toString() || '',
      email: formData.get('email')?.toString() || '',
      gender: formData.get('gender')?.toString() || '',
      department: formData.get('department')?.toString() || '',
      phoneNumber: formData.get('phoneNumber')?.toString() || '',
      facebookLink: formData.get('facebookLink')?.toString() || '',
      currentAddress: formData.get('currentAddress')?.toString() || '',
      transportation: formData.get('transportation')?.toString() || '',
      healthNote: formData.get('healthNote')?.toString() || '',
      strengthsWeaknesses: formData.get('strengthsWeaknesses')?.toString() || '',
      specialSkills: formData.get('specialSkills')?.toString() || '',
      photo: formData.get('photo'),

      optionalPersonal1: formData.get('optionalPersonal1')?.toString() || '',
      optionalPersonal2: formData.get('optionalPersonal2')?.toString() || '',
      optionalPersonal3: formData.get('optionalPersonal3')?.toString() || '',
      optionalPersonal4: formData.get('optionalPersonal4')?.toString() || '',
      optionalPersonal5: formData.get('optionalPersonal5')?.toString() || '',
      optionalPersonal6: formData.get('optionalPersonal6')?.toString() || '',
      optionalPersonal7: formData.get('optionalPersonal7')?.toString() || '',
      optionalPersonal8: formData.get('optionalPersonal8')?.toString() || '',


      deptOptional1: formData.get('deptOptional1')?.toString() || '',
      deptOptional2: formData.get('deptOptional2')?.toString() || '',
      deptOptional3: formData.get('deptOptional3')?.toString() || '',
      deptOptional4: formData.get('deptOptional4')?.toString() || '',
      deptOptional5: formData.get('deptOptional5')?.toString() || '',
      deptOptional6: formData.get('deptOptional6')?.toString() || '',
    });

    if (!validatedFields.success) {
      const fields: Record<string, string> = {};
      for (const key in validatedFields.error.flatten().fieldErrors) {
          const value = formData.get(key);
          if (typeof value === 'string') {
              fields[key] = value;
          }
      }
      
      // Log validation errors để debug
      console.log('Validation errors:', validatedFields.error.flatten().fieldErrors);
      
      return {
        message: "Lỗi xác thực. Vui lòng kiểm tra lại thông tin.",
        issues: Object.values(validatedFields.error.flatten().fieldErrors).flat().filter(Boolean),
        fields
      };
    }

    if (!supabaseAdmin) {
      return {
        message: "Hệ thống chưa cấu hình Supabase (missing SUPABASE_SERVICE_ROLE_KEY).",
        issues: ["SUPABASE_SERVICE_ROLE_KEY is not set on the server."],
      };
    }

    const templateId = validatedFields.data.templateId;
    const photoFile = validatedFields.data.photo as File | undefined;

    const { data: template, error: templateError } = await supabaseAdmin
      .from("application_form_templates")
      .select("id")
      .eq("id", templateId)
      .single();

    if (templateError || !template?.id) {
      return {
        message: "Không tìm thấy cấu hình form hợp lệ.",
        issues: templateError ? [templateError.message] : ["Missing template."],
      };
    }

    let photoUrl = "";

    if (photoFile && typeof (photoFile as any).arrayBuffer === "function") {
      try {
        photoUrl = await uploadApplicantPhoto(photoFile, templateId);
      } catch (uploadError) {
        console.error('Photo upload to Supabase failed, continue without photo:', uploadError);
      }
    }

    const optionalPersonalAnswers = [
      validatedFields.data.optionalPersonal1 ?? "",
      validatedFields.data.optionalPersonal2 ?? "",
      validatedFields.data.optionalPersonal3 ?? "",
      validatedFields.data.optionalPersonal4 ?? "",
      validatedFields.data.optionalPersonal5 ?? "",
      validatedFields.data.optionalPersonal6 ?? "",
      validatedFields.data.optionalPersonal7 ?? "",
      validatedFields.data.optionalPersonal8 ?? "",
    ];

    const deptOptionalAnswers = [
      validatedFields.data.deptOptional1 ?? "",
      validatedFields.data.deptOptional2 ?? "",
      validatedFields.data.deptOptional3 ?? "",
      validatedFields.data.deptOptional4 ?? "",
      validatedFields.data.deptOptional5 ?? "",
      validatedFields.data.deptOptional6 ?? "",
    ];

    const { error: insertError } = await supabaseAdmin
      .from("application_form_submissions")
      .insert({
        template_id: templateId,
        full_name: validatedFields.data.fullName,
        birth_date: validatedFields.data.birthDate,
        class_name: validatedFields.data.className,
        student_id: validatedFields.data.studentId,
        email: validatedFields.data.email,
        gender: validatedFields.data.gender,
        photo_url: photoUrl,
        department: validatedFields.data.department,
        optional_personal_answers: optionalPersonalAnswers,
        dept_optional_answers: deptOptionalAnswers,
        phone_number: validatedFields.data.phoneNumber,
        facebook_link: validatedFields.data.facebookLink,
        current_address: validatedFields.data.currentAddress,
        transportation: validatedFields.data.transportation,
        health_note: validatedFields.data.healthNote,
        strengths_weaknesses: validatedFields.data.strengthsWeaknesses,
        special_skills: validatedFields.data.specialSkills,
      });

    if (insertError) {
      return {
        message: "Gửi đơn thất bại. Vui lòng thử lại sau.",
        issues: [insertError.message],
      };
    }
    // =========================================================================
    // 🔥 HÀM GỬI MAIL CTV NỘP ĐƠN
    // =========================================================================
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: "Hệ thống Quản trị ĐK-TCNH <hethong@dktcnh.id.vn>", // Chuẩn hethong@ mượt mà không dính alert no-reply
          to: [validatedFields.data.email], // Bắn thẳng về mail sinh viên nộp đơn
          replyTo: "ducthk25414@st.uel.edu.vn", // Các bạn phản hồi sẽ tự bay về mail Đoàn Khoa
          subject: `[ĐK-TCNH] XÁC NHẬN NỘP ĐƠN ỨNG TUYỂN THÀNH CÔNG - ${validatedFields.data.fullName.toUpperCase()}`,          
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px;">
                <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">XÁC NHẬN NỘP ĐƠN ỨNG TUYỂN THÀNH CÔNG</h2>
                <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Chương trình Tuyển Cộng tác viên Đoàn khoa Tài chính - Ngân hàng năm học 2026 - 2027</p>
              </div>

              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Chào <strong>${validatedFields.data.fullName}</strong>,</p>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hệ thống Quản trị Đoàn khoa Tài chính - Ngân hàng đã ghi nhận biểu mẫu đăng ký ứng tuyển Cộng tác viên của bạn thành công. Cảm ơn bạn đã quan tâm và mong muốn đồng hành cùng các hoạt động sắp tới.</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #1e3a8a; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <h4 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 15px;">THÔNG TIN HỒ SƠ ĐÃ GHI NHẬN:</h4>
                <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>• Họ và tên:</strong> ${validatedFields.data.fullName}</p>
                <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>• Mã số sinh viên:</strong> ${validatedFields.data.studentId}</p>
                <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>• Lớp:</strong> ${validatedFields.data.className || "N/A"}</p>
                <p style="margin: 6px 0; font-size: 14px; color: #475569;"><strong>• Ban ứng tuyển:</strong> <span style="color: #dc2626; font-weight: bold;">${validatedFields.data.department}</span></p>
              </div>

              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hồ sơ của bạn hiện đã được chuyển giao cho Ban chuyên môn phụ trách tiến hành xem xét vòng đơn. Kết quả vòng đơn cũng như lịch trình chi tiết vòng phỏng vấn (nếu có) sẽ được gửi đến bạn sớm nhất qua địa chỉ email này.</p>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Chúc bạn có một trải nghiệm thật rạng rỡ cùng Đoàn khoa Tài chính - Ngân hàng nhé!</p>

              <div style="margin-top: 35px; border-top: 1px dashed #cbd5e1; padding-top: 15px; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  * Đây là email gửi tự động từ hệ thống quản lý, mọi thắc mắc xin vui lòng liên hệ với Ban tổ chức thông qua địa chỉ email: dktaichinhnganhang@st.uel.edu.vn
                </p>
              </div>

            </div>
          `,
        });
        console.log(`🚀 [Server Action] Email xác nhận nộp đơn thành công đã được gửi đến: ${validatedFields.data.email}`);
      } catch (mailError) {
        console.error("❌ Lỗi trong quá trình bắn mail qua Resend:", mailError);
      }
    } else {
      console.warn("⚠️ Bỏ qua gửi mail vì thiếu cấu hình RESEND_API_KEY trong môi trường chạy.");
    }
    return {
      message: `Cảm ơn bạn ${validatedFields.data.fullName}! Đơn ứng tuyển của bạn đã được gửi thành công.`,
      issues: undefined,
    };
    // =========================================================================
  } catch (error) {
    console.error("Error submitting application:", error);
    return {
      message: "Đã xảy ra lỗi khi gửi đơn. Vui lòng thử lại sau.",
      issues: [],
    }
  }
}
