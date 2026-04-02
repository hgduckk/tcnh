"use client";

import Link from "next/link";
import { PageBanner } from "@/components/shared/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPinned, Flag, ArrowRight } from "lucide-react";

export default function YouthPage() {
  const activities = [
    {
      key: "a80",
      title: "A80 - Rạng Rỡ Việt Nam",
      subtitle: "Không gian gửi lời chúc, hành trình lịch sử và thế hệ tiếp bước.",
      status: "Đang hoạt động",
      href: "/youth/a80",
      icon: Flag,
      accent: "from-red-600 to-orange-500",
    },
    {
      key: "school-map",
      title: "Công trình thanh niên - Bản đồ trường học",
      subtitle: "Sơ khảo công trình số hỗ trợ tìm địa điểm và dịch vụ trong trường.",
      status: "Sơ khảo",
      href: "/youth/school-map",
      icon: MapPinned,
      accent: "from-sky-600 to-cyan-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#fff2d6,transparent_40%),radial-gradient(circle_at_100%_20%,#dbeafe,transparent_35%),linear-gradient(180deg,#fffdf8_0%,#f8fafc_100%)]">
      <PageBanner
        title="TUỔI TRẺ FBMC"
        subtitle="Danh sách hoạt động ngoại khóa dành cho sinh viên. Chọn một hoạt động để vào trang riêng của hoạt động đó."
        imageUrl="/images/back-ocean.jpg"
        imageHint="youth activities"
      />

      <main className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-3xl mx-auto">
            <p className="uppercase tracking-[0.22em] text-xs md:text-sm text-slate-500 font-semibold">Youth Activities</p>
            <h1 className="text-3xl md:text-5xl font-anton text-slate-900">Danh sách hoạt động ngoại khóa</h1>
            <p className="text-slate-600">Nhấn vào một hoạt động để chuyển sang trang riêng của hoạt động đó.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {activities.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.key} className="overflow-hidden rounded-3xl border-slate-200 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className={`h-2 w-full bg-gradient-to-r ${item.accent}`} />
                    <div className="p-6 md:p-7 space-y-4 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl p-2 bg-slate-100">
                            <Icon className="w-5 h-5 text-slate-700" />
                          </div>
                          <h2 className="font-anton text-2xl text-slate-900 leading-tight">{item.title}</h2>
                        </div>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>

                      <p className="text-slate-600">{item.subtitle}</p>

                      <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white">
                        <Link href={item.href} className="inline-flex items-center gap-2">
                          Vào hoạt động
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
