"use client";

import { useState } from "react";
import Link from "next/link";
import { PageBanner } from "@/components/shared/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPinned, Flag, ArrowRight } from "lucide-react";

export default function YouthPage() {
  const [pendingActivityTitle, setPendingActivityTitle] = useState<string | null>(null);

  const activities = [
    {
      key: "a80",
      title: "Rạng Rỡ Việt Nam",
      subtitle: "Hoạt động gửi lời chúc tới lễ diễu binh, diễu hành kỷ niệm 80 năm ngày Quốc khánh Việt Nam.",
      status: "Đang hoạt động",
      isAvailable: true,
      href: "/youth/a80",
      icon: Flag,
      accent: "from-red-600 to-orange-500",
    },
    {
      key: "school-map",
      title: "UEL Campus Map",
      subtitle: "Công trình thanh niên năm học 2025 - 2026 - Bản đồ số Trường Đại học Kinh tế - Luật, ĐHQG-HCM.",
      status: "Đang phát triển",
      isAvailable: false,
      href: "/youth/school-map",
      icon: MapPinned,
      accent: "from-sky-600 to-cyan-500",
    },
    {
      key: "na",
      title: "Title",
      subtitle: "Subtitle",
      status: "Đang phát triển",
      isAvailable: false,
      href: "/youth/na",
      icon: MapPinned,
      accent: "from-sky-600 to-cyan-500",
    },
    {
      key: "na",
      title: "Title",
      subtitle: "Subtitle",
      status: "Đang phát triển",
      isAvailable: false,
      href: "/youth/na",
      icon: MapPinned,
      accent: "from-sky-600 to-cyan-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#fff2d6,transparent_40%),radial-gradient(circle_at_100%_20%,#dbeafe,transparent_35%),linear-gradient(180deg,#fffdf8_0%,#f8fafc_100%)]">
      <PageBanner
        title="TUỔI TRẺ TÀI CHÍNH - NGÂN HÀNG"
        subtitle="Nơi hội tụ những hoạt động sôi nổi dành cho đoàn viên/thanh niên"
        imageUrl="/images/back-ocean.jpg"
        imageHint="youth activities"
      />

      <main className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <section className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {activities.map((item) => {
              const Icon = item.icon;
              const buttonClasses = item.isAvailable
                ? "group/cta border border-slate-900 bg-slate-900 text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md"
                : "group/cta border border-slate-300 bg-slate-100 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-200 hover:text-slate-800 hover:shadow-md";
              const buttonInner = (
                <>
                  <span className="relative inline-flex items-center gap-2">
                    Chi tiết
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                  </span>
                </>
              );

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

                      <p className="text-slate-600 italic">{item.subtitle}</p>

                      {item.isAvailable ? (
                        <Button asChild className={buttonClasses}>
                          <Link href={item.href} className="inline-flex items-center gap-2">
                            {buttonInner}
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className={buttonClasses}
                          onClick={() => setPendingActivityTitle(item.title)}
                        >
                          {buttonInner}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <AlertDialog open={Boolean(pendingActivityTitle)} onOpenChange={(open) => {
        if (!open) {
          setPendingActivityTitle(null);
        }
      }}>
        <AlertDialogContent className="border-slate-200 bg-white sm:rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-anton text-2xl text-slate-900 text-center">
              Coming soon!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="rounded-xl bg-slate-900 text-white transition-colors duration-300 hover:bg-amber-500 hover:text-slate-950"
              onClick={() => setPendingActivityTitle(null)}
            >
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
