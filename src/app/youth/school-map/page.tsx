"use client";

import { PageBanner } from "@/components/shared/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPinned, School, Users } from "lucide-react";

export default function YouthSchoolMapPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_80%_10%,#dcfce7,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <PageBanner
        title="CÔNG TRÌNH THANH NIÊN"
        subtitle="Bản đồ trường học - bản sơ khảo dành cho sinh viên"
        imageUrl="/images/back-ocean.jpg"
        imageHint="school map"
      />

      <main className="container mx-auto px-4 md:px-8 py-12 md:py-16 space-y-8">
        <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl">
          <CardContent className="p-7 md:p-10 space-y-7">
            <div className="space-y-2">
              <p className="uppercase tracking-[0.18em] text-xs md:text-sm text-slate-500">Sơ khảo giao diện</p>
              <h1 className="text-3xl md:text-5xl font-anton text-slate-900">Bản đồ trường học</h1>
              <p className="text-slate-600 max-w-3xl">
                Trang này là bản sơ khảo để duyệt hướng thiết kế trước khi nối dữ liệu thật.
                Mục tiêu là giúp sinh viên mới tìm khu học, khu dịch vụ và điểm hỗ trợ nhanh hơn.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-6">
              <div className="rounded-2xl border bg-slate-50 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800">Preview bản đồ khuôn viên</h2>
                  <Badge variant="outline">Wireframe</Badge>
                </div>
                <div className="aspect-[16/10] rounded-xl bg-[linear-gradient(135deg,#f8fafc_0%,#e0f2fe_45%,#dbeafe_100%)] border relative overflow-hidden">
                  <div className="absolute left-[12%] top-[16%] rounded-lg px-3 py-2 bg-white shadow border text-xs">A Block</div>
                  <div className="absolute left-[36%] top-[38%] rounded-lg px-3 py-2 bg-white shadow border text-xs">Library</div>
                  <div className="absolute right-[15%] top-[25%] rounded-lg px-3 py-2 bg-white shadow border text-xs">Canteen</div>
                  <div className="absolute left-[28%] bottom-[16%] rounded-lg px-3 py-2 bg-white shadow border text-xs">Student Service</div>
                  <div className="absolute right-[18%] bottom-[22%] rounded-lg px-3 py-2 bg-white shadow border text-xs">Parking</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border p-4 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <School className="w-4 h-4 text-sky-600" />
                    <p className="font-semibold text-slate-800">Giai đoạn 1</p>
                  </div>
                  <p className="text-sm text-slate-600">Chuẩn hóa dữ liệu tòa nhà, phòng ban và dịch vụ sinh viên.</p>
                </div>

                <div className="rounded-2xl border p-4 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPinned className="w-4 h-4 text-sky-600" />
                    <p className="font-semibold text-slate-800">Giai đoạn 2</p>
                  </div>
                  <p className="text-sm text-slate-600">Tìm đường từ vị trí hiện tại tới lớp học hoặc địa điểm cần đến.</p>
                </div>

                <div className="rounded-2xl border p-4 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-sky-600" />
                    <p className="font-semibold text-slate-800">Giai đoạn 3</p>
                  </div>
                  <p className="text-sm text-slate-600">Cho phép sinh viên góp ý bổ sung địa điểm mới trên bản đồ.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-sky-600 hover:bg-sky-700 text-white">Duyệt sơ khảo</Button>
              <Button variant="outline">Bổ sung địa điểm mẫu</Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
