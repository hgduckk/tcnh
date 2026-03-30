"use server";

import { z } from 'zod';
// import { moderateBlogComments } from '@/ai/flows/moderate-blog-comments';
// import { analyzeApplication } from '@/ai/flows/analyze-application';
import { ContactFormSchema, CommentFormSchema, ApplicationFormSubmissionStrictSchema, type ContactFormState, type CommentFormState, type ApplicationFormState } from '@/lib/definitions';
import { appendContactToSheet, appendSubmissionToSheet } from '@/lib/google-sheets';
import { supabase } from "@/lib/supabaseClient";
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { uploadFileToDrive } from '@/lib/google-drive';

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

  try {
    // Ghi dữ liệu vào Google Sheet
    await appendContactToSheet({ name, email, message });
    
    return { message: `Thank you, ${name}! Your message has been received and saved.` };
  } catch (error) {
    console.error("Error saving to Google Sheet:", error);
    return { message: `Thank you, ${name}! Your message has been received.` };
  }
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

      photo: formData.get('photo'),

      optionalPersonal1: formData.get('optionalPersonal1')?.toString() || '',
      optionalPersonal2: formData.get('optionalPersonal2')?.toString() || '',
      optionalPersonal3: formData.get('optionalPersonal3')?.toString() || '',
      optionalPersonal4: formData.get('optionalPersonal4')?.toString() || '',
      optionalPersonal5: formData.get('optionalPersonal5')?.toString() || '',

      deptOptional1: formData.get('deptOptional1')?.toString() || '',
      deptOptional2: formData.get('deptOptional2')?.toString() || '',
      deptOptional3: formData.get('deptOptional3')?.toString() || '',
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
    const photoFile = validatedFields.data.photo as File;

    // Load template to get the Drive folder id
    const { data: template, error: templateError } = await supabaseAdmin
      .from("application_form_templates")
      .select("drive_folder_id")
      .eq("id", templateId)
      .single();

    if (templateError || !template?.drive_folder_id) {
      return {
        message: "Không tìm thấy cấu hình form hợp lệ.",
        issues: templateError ? [templateError.message] : ["Missing drive_folder_id in template."],
      };
    }

    // Upload applicant photo to Google Drive
    const buffer = Buffer.from(await photoFile.arrayBuffer());
    const uploadRes = await uploadFileToDrive({
      folderId: template.drive_folder_id,
      filename: photoFile.name || "photo",
      mimeType: photoFile.type || "image/jpeg",
      buffer,
    });

    const optionalPersonalAnswers = [
      validatedFields.data.optionalPersonal1 ?? "",
      validatedFields.data.optionalPersonal2 ?? "",
      validatedFields.data.optionalPersonal3 ?? "",
      validatedFields.data.optionalPersonal4 ?? "",
      validatedFields.data.optionalPersonal5 ?? "",
    ];

    const deptOptionalAnswers = [
      validatedFields.data.deptOptional1 ?? "",
      validatedFields.data.deptOptional2 ?? "",
      validatedFields.data.deptOptional3 ?? "",
    ];

    // -- Primary: write to Google Sheets --
    const sheetResult = await appendSubmissionToSheet({
      templateId,
      fullName: validatedFields.data.fullName,
      birthDate: validatedFields.data.birthDate,
      className: validatedFields.data.className,
      studentId: validatedFields.data.studentId,
      email: validatedFields.data.email,
      gender: validatedFields.data.gender,
      department: validatedFields.data.department,
      photoUrl: uploadRes.url,
      optionalPersonalAnswers: optionalPersonalAnswers,
      deptOptionalAnswers: deptOptionalAnswers,
    });

    // -- Backup: save to Supabase regardless of Sheets result --
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
        photo_url: uploadRes.url,
        department: validatedFields.data.department,
        optional_personal_answers: optionalPersonalAnswers,
        dept_optional_answers: deptOptionalAnswers,
        sheet_write_ok: sheetResult.success,
        sheet_error: sheetResult.success ? null : sheetResult.message,
      });

    if (insertError) {
      return {
        message: "Gửi đơn thất bại. Vui lòng thử lại sau.",
        issues: [insertError.message],
      };
    }

    return {
      message: `Cảm ơn bạn ${validatedFields.data.fullName}! Đơn ứng tuyển của bạn đã được gửi thành công.`,
      issues: undefined,
    };

  } catch (error) {
    console.error("Error submitting application:", error);
    return {
      message: "Đã xảy ra lỗi khi gửi đơn. Vui lòng thử lại sau.",
      issues: [],
    }
  }
}
