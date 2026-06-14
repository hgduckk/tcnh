"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import { PageBanner } from "@/components/shared/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, GraduationCap, Search, ShieldCheck, BookOpen } from "lucide-react";

// ── Placeholder data — replace with real API calls when backend is ready ──────
const PLACEHOLDER_CLASSES = [
  { id: "1", name: "TC44A", advisor: "ThS. Nguyễn Văn A", studentCount: 42 },
  { id: "2", name: "TC44B", advisor: "ThS. Trần Thị B", studentCount: 38 },
  { id: "3", name: "NH44A", advisor: "TS. Lê Văn C", studentCount: 40 },
  { id: "4", name: "NH44B", advisor: "ThS. Phạm Thị D", studentCount: 35 },
  { id: "5", name: "TCNH44A", advisor: "TS. Hoàng Văn E", studentCount: 44 },
  { id: "6", name: "TCNH44B", advisor: "ThS. Vũ Thị F", studentCount: 39 },
];

export default function StudentInfoPage() {
  const [form, setForm] = useState({
    fullName: "",
    studentId: "",
    birthDate: "",
    className: "",
  });
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const totalClasses = PLACEHOLDER_CLASSES.length;
  const totalStudents = PLACEHOLDER_CLASSES.reduce((s, c) => s + c.studentCount, 0);
  const totalAdvisors = new Set(PLACEHOLDER_CLASSES.map((c) => c.advisor)).size;

  const handleSearch = () => {
    if (!form.studentId.trim()) return;
    setSearching(true);
    // TODO: replace with real API call
    setTimeout(() => {
      setSearching(false);
      setSearched(true);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#eff6ff,transparent_40%),radial-gradient(circle_at_100%_20%,#f0fdf4,transparent_35%),linear-gradient(180deg,#fffdf8_0%,#f8fafc_100%)]">
      <PageBanner
        title="THÔNG TIN SINH VIÊN"
        subtitle="Danh sách lớp, cố vấn học tập và tra cứu thông tin sinh viên"
        imageUrl="/images/back-ocean.jpg"
        imageHint="student information"
      />

      <main className="container mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12">

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section>
          <div className="mb-5">
            <p className="uppercase tracking-[0.18em] text-xs text-slate-500">Tổng quan</p>
            <h2 className="text-2xl md:text-3xl font-anton text-slate-900 mt-1">Thống kê chung</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-xl bg-blue-50 p-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalClasses}</p>
                  <p className="text-sm text-slate-500">Lớp trong khoa</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalStudents}</p>
                  <p className="text-sm text-slate-500">Sinh viên</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm col-span-2 md:col-span-1">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-xl bg-amber-50 p-3">
                  <GraduationCap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalAdvisors}</p>
                  <p className="text-sm text-slate-500">Cố vấn học tập</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Class list ─────────────────────────────────────────────────── */}
        <section>
          <div className="mb-5">
            <p className="uppercase tracking-[0.18em] text-xs text-slate-500">Danh sách</p>
            <h2 className="text-2xl md:text-3xl font-anton text-slate-900 mt-1">Các lớp trong khoa</h2>
            <p className="text-slate-500 text-sm mt-1">Dữ liệu minh họa — chờ kết nối backend.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLACEHOLDER_CLASSES.map((cls) => (
              <Card
                key={cls.id}
                className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 text-lg">{cls.name}</h3>
                    <Badge
                      variant="outline"
                      className="border-blue-200 bg-blue-50 text-blue-700 text-xs shrink-0"
                    >
                      {cls.studentCount} SV
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{cls.advisor}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Student lookup ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-5">
            <p className="uppercase tracking-[0.18em] text-xs text-slate-500">Tra cứu</p>
            <h2 className="text-2xl md:text-3xl font-anton text-slate-900 mt-1">
              Tra cứu thông tin sinh viên
            </h2>
          </div>

          <Card className="rounded-3xl border-slate-200 bg-white shadow-lg max-w-2xl">
            <CardHeader className="pb-2">
              <div className="flex items-start gap-2.5 text-sm text-slate-600">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <p>
                  Thông tin cá nhân của bạn{" "}
                  <strong>sẽ không được hiển thị</strong> nhằm đảm bảo quyền
                  riêng tư. Hệ thống chỉ xác nhận tình trạng đăng ký và thông
                  tin chung của lớp.
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Họ và tên
                  </label>
                  <Input
                    placeholder="Nhập họ và tên..."
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    MSSV <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Mã số sinh viên..."
                    value={form.studentId}
                    onChange={(e) =>
                      setForm({ ...form, studentId: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Ngày sinh
                  </label>
                  <Input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) =>
                      setForm({ ...form, birthDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Lớp
                  </label>
                  <Input
                    placeholder="VD: TC44A..."
                    value={form.className}
                    onChange={(e) =>
                      setForm({ ...form, className: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={!form.studentId.trim() || searching}
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
              >
                {searching ? (
                  "Đang tra cứu..."
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Tra cứu
                  </>
                )}
              </Button>

              {searched && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1.5">
                  <p className="font-semibold text-emerald-800 text-sm">
                    Kết quả tra cứu
                  </p>
                  <p className="text-sm text-emerald-700">
                    Đã tìm thấy thông tin trong hệ thống. Để bảo vệ quyền riêng
                    tư, chi tiết cá nhân không được hiển thị.
                  </p>
                  <p className="text-xs text-emerald-600 pt-1 border-t border-emerald-200">
                    Tính năng đang trong giai đoạn phát triển — dữ liệu thực sẽ
                    có sau khi backend hoàn thiện.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
