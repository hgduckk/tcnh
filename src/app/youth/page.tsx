"use client";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tuổi trẻ',
};
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PageBanner } from "@/components/shared/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPinned, ArrowRight } from "lucide-react";
import type { YouthRow } from "@/lib/youth";

export default function YouthPage() {
  const [pendingItem, setPendingItem] = useState<{ title: string; status: YouthRow["launch_status"] } | null>(null);
  const [activities, setActivities] = useState<YouthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/youth", { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải dữ liệu hoạt động.");
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? (json.data as YouthRow[]) : [];
        setActivities(rows);
      } catch (e) {
        setError(String(e));
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

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

          {loading ? (
            <p className="text-center text-slate-600">Đang tải hoạt động...</p>
          ) : null}

          {error ? (
            <p className="text-center text-red-600">Lỗi: {error}</p>
          ) : null}

          {!loading && !error && activities.length === 0 ? (
            <p className="text-center text-slate-600">Chưa có hoạt động nào cho trang Tuổi Trẻ.</p>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {activities.map((item) => {
              const isAvailable = item.launch_status === "active" && Boolean(item.target_href);
              const status =
                item.launch_status === "coming_soon"
                  ? "Đang phát triển"
                  : item.launch_status === "ended"
                    ? "Đã kết thúc"
                    : "Đang hoạt động";
              const accent =
                item.launch_status === "coming_soon"
                  ? "from-amber-500 to-yellow-500"
                  : item.launch_status === "ended"
                    ? "from-rose-600 to-red-500"
                    : "from-emerald-600 to-green-500";
              const statusBadgeClass =
                item.launch_status === "coming_soon"
                  ? "border-amber-200 bg-amber-100 text-amber-800"
                  : item.launch_status === "ended"
                    ? "border-red-200 bg-red-100 text-red-800"
                    : "border-emerald-200 bg-emerald-100 text-emerald-800";
              const buttonClasses = isAvailable
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
                <Card key={item.id} className="overflow-hidden rounded-3xl border-slate-200 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-0">
                    <div className={`h-2 w-full bg-gradient-to-r ${accent}`} />
                    <div className="p-6 md:p-7 space-y-4 bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl overflow-hidden w-10 h-10 flex-shrink-0 bg-slate-100">
                            {item.icon_url ? (
                              <Image
                                src={item.icon_url}
                                alt={`${item.name} icon`}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <MapPinned className="w-5 h-5 text-slate-700" />
                              </div>
                            )}
                          </div>
                          <h2 className="font-anton text-2xl text-slate-900 leading-tight">{item.name}</h2>
                        </div>
                        <Badge variant="outline" className={statusBadgeClass}>{status}</Badge>
                      </div>

                      <p className="text-slate-600 italic">{item.subtitle || "Đang cập nhật nội dung."}</p>

                      {isAvailable ? (
                        <Button asChild className={buttonClasses}>
                          <Link href={item.target_href} className="inline-flex items-center gap-2">
                            {buttonInner}
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          className={buttonClasses}
                          onClick={() => setPendingItem({ title: item.name, status: item.launch_status })}
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

      <AlertDialog open={pendingItem?.status === "coming_soon"} onOpenChange={(open) => {
        if (!open) {
          setPendingItem(null);
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
              onClick={() => setPendingItem(null)}
            >
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingItem?.status === "ended"} onOpenChange={(open) => {
        if (!open) {
          setPendingItem(null);
        }
      }}>
        <AlertDialogContent className="border-slate-200 bg-white sm:rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-anton text-2xl text-slate-900 text-center">
              Kết thúc!
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="rounded-xl bg-slate-900 text-white transition-colors duration-300 hover:bg-red-500 hover:text-white"
              onClick={() => setPendingItem(null)}
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
