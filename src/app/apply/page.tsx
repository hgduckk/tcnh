"use client"; // BẮT BUỘC THÊM DÒNG NÀY

import { PageBanner } from '@/components/shared/PageBanner';
import { TemplateDrivenApplicationForm } from '@/components/apply/TemplateDrivenApplicationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react'; // Đã thêm icon cho đẹp

export default function ApplyPage() {
  // Định nghĩa hàm xử lý sự kiện trong Client Component
  const handleOpenAiTest = () => {
    window.open('/ai', '_blank');
  };

  return (
    <div className="apply-page">
      <PageBanner
        title="GÓC TÌM NGƯỜI NHÀ"
        subtitle='"Chần chờ gì mà không tham gia vào Đoàn khoa Tài chính - Ngân hàng"'
        imageUrl="/images/back-bia-mo.jpg"
        imageHint="recruitment hiring"
      />
      <main className="container mx-auto px-4 py-16 md:py-24 mb-0 mt-0">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="flex justify-center my-4 mb-10 md:mb-14 mt-0">
              <Image
                  src="/images/back-bia.jpg"
                  alt="DoanKhoa"
                  width={1000}
                  height={1000}
                  className="rounded-3xl shadow-md"
              />
            </div>
            
            {/* Box trắc nghiệm AI */}
            <div className="my-6 p-4 border border-blue-200 bg-blue-50 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-bold text-blue-900">Bạn còn phân vân chưa biết chọn Ban nào?</h4>
                  <p className="text-sm text-blue-700">Hãy để FABI tư vấn ban phù hợp nhất dựa trên tính cách của bạn.</p>
                </div>
              </div>
              <Button 
                onClick={handleOpenAiTest} 
                className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                👉 Làm test AI ngay
              </Button>
            </div>

            <div className="mb-10"></div>
            
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle style={{ color: "#45973c" }} className="text-3xl font-anton font-medium text-primary text-center">
                  Đơn đăng ký ứng tuyển
                </CardTitle>
                <CardDescription></CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateDrivenApplicationForm />
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </main>
      <Footer />
    </div>
  );
}