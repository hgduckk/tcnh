import { PageBanner } from '@/components/shared/PageBanner';
import { TemplateDrivenApplicationForm } from '@/components/apply/TemplateDrivenApplicationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import Image from "next/image";

export default function ApplyPage() {
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
                  className="rounded-3xl shadow-md center"
              />
            </div>
            <Card className="shadow-2xl">
              <CardHeader>
                <CardTitle style={{ color: "#45973c" }} className="text-3xl font-anton font-medium text-primary text-center">Đơn đăng ký ứng tuyển</CardTitle>
                <CardDescription>
                </CardDescription>
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
