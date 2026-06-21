import { NextRequest, NextResponse } from 'next/server';
import { personalAdvisorChat } from '@/ai/flows/personal-advisor-chat';

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { message, context } = body;

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    // 1. Thử dùng AI chính để phân tích
    const aiResult = await personalAdvisorChat({
      message,
      context: context || {} 
    });
    return NextResponse.json({ response: aiResult.response });
    
  } catch (error) {
    console.error('Chat API error, using fallback:', error);
    // 2. Nếu AI chính lỗi, dùng hàm dự phòng (fallback)
    const fallbackResponse = generateSimpleResponse(message, context || {});
    return NextResponse.json({ response: fallbackResponse });
  }
}

function generateSimpleResponse(message: string, context: any): string {
  const department = context?.departmentInfo;
  const lowerMessage = message.toLowerCase();

  // Kiểm tra nếu có kết quả trắc nghiệm gửi lên
  if (context?.quizAnswers) {
    return `Chúc mừng bạn đã hoàn thành bài khảo sát! Dựa trên câu trả lời của bạn, mình nhận thấy bạn có tố chất phù hợp với các công việc sáng tạo và tổ chức. Bạn có muốn mình tư vấn kỹ hơn về các ban chuyên môn không?`;
  }

  if (lowerMessage.includes('tại sao') || lowerMessage.includes('phù hợp')) {
    return `Dựa trên kết quả test, bạn phù hợp với ${department?.name || 'ban này'} vì bạn thể hiện những đặc điểm mạnh mẽ về kỹ năng mềm. Bạn có muốn giải thích thêm về các hoạt động cụ thể không?`;
  }

  if (lowerMessage.includes('hoạt động') || lowerMessage.includes('làm gì')) {
    return `${department?.name || 'Ban'} tham gia các hoạt động như tổ chức sự kiện, truyền thông và hỗ trợ phong trào thanh niên. Bạn có muốn biết cách thức tham gia không?`;
  }

  return `Chào bạn! Rất vui được hỗ trợ bạn. Mình có thể giúp bạn giải thích tại sao bạn phù hợp với ban, chia sẻ về các hoạt động hoặc lời khuyên phát triển cá nhân. Bạn muốn tìm hiểu về điều gì? 😊`;
}