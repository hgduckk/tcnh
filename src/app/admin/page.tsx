// ─────────────────────────────────────────────────────────────────────────────
// Admin Page — redesigned with Overview / Function / Category structure
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Footer } from '@/components/layout/Footer';
import { ApplicationFormsAdmin } from '@/components/admin/ApplicationFormsAdmin';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  LayoutDashboard, Wrench, FolderOpen, Home, Trophy, Activity, FileText,
  ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Loader2,
  ImagePlus, Video, PlusCircle, Database, Bot, FileSpreadsheet, ShieldCheck,
  LogOut, Eye, ClipboardList, ArrowRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface VisitMetrics { visits: number; lastUpdated: string; }
interface SiteConfig {
  frontendUrl: string;
  showAdminLink: boolean;
  adminLinkLabel: string;
}

interface FormSubmission {
  id: string;
  template_id: string;
  submitted_at: string;
  full_name: string;
  birth_date?: string;
  class_name?: string;
  student_id?: string;
  email?: string;
  gender?: string;
  department: string;
  photo_url: string;
  optional_personal_answers: string[];
  dept_optional_answers: string[];
}

interface FormTemplateSummary {
  id: string;
  name: string;
  open_at: string;
  close_at: string;
}

type AdminTab =
  | 'overview'
  | 'function'
  | 'category-home'
  | 'category-achievements'
  | 'category-activities'
  | 'category-apply';

type ServiceStatus = 'idle' | 'loading' | 'ok' | 'error';

// ── Sidebar button ─────────────────────────────────────────────────────────────

function SidebarBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
        active
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : ''}`} />
      {label}
    </button>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ServiceStatus }) {
  if (status === 'idle')
    return <Badge variant="outline" className="text-xs">Chưa kiểm tra</Badge>;
  if (status === 'loading')
    return <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Đang kiểm tra…</Badge>;
  if (status === 'ok')
    return <Badge className="text-xs bg-green-100 text-green-700 border border-green-200 hover:bg-green-100">Successful</Badge>;
  return <Badge className="text-xs bg-red-100 text-red-700 border border-red-200 hover:bg-red-100">Unsuccessful</Badge>;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<VisitMetrics | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [formTemplates, setFormTemplates] = useState<FormTemplateSummary[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [categoryOpen, setCategoryOpen] = useState(true);

  const authHeaders = useMemo(() => ({ 'x-admin-password': password }), [password]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setLoginError(null);
    setAuthenticating(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setLoginError(payload?.message || 'Mật khẩu sai, vui lòng nhập lại!');
        return;
      }
      setIsAuthenticated(true);
    } catch {
      setLoginError('Không thể xác thực admin. Vui lòng thử lại.');
    } finally {
      setAuthenticating(false);
    }
  };

  // ── Data loading ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const [metricsRes, subsRes, formsRes] = await Promise.all([
        fetch('/api/admin/visits', { headers: authHeaders }),
        fetch('/api/admin/application-form-submissions?page=1&pageSize=500', { headers: authHeaders }),
        fetch('/api/admin/forms', { headers: authHeaders }),
      ]);
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (subsRes.ok) {
        const payload = await subsRes.json();
        setTotalSubmissions(payload?.total ?? 0);
        setFormSubmissions(Array.isArray(payload?.data) ? payload.data : []);
      }
      if (formsRes.ok) {
        const payload = await formsRes.json();
        setFormTemplates(Array.isArray(payload?.data) ? payload.data : []);
      }
    })();
  }, [isAuthenticated, authHeaders]);

  useEffect(() => {
    fetch('/api/site-config')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setSiteConfig(d))
      .catch(() => null);
  }, []);

  // ── Login screen ──────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-xl">Đăng nhập Admin</CardTitle>
            <CardDescription className="text-sm mt-1">Nhập mật khẩu để truy cập bảng điều khiển</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="mb-3"
            />
            {loginError && <p className="text-sm text-red-600 mb-3">{loginError}</p>}
            <Button onClick={handleLogin} disabled={authenticating} className="w-full">
              {authenticating
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang xác thực…</>
                : 'Đăng nhập'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Authenticated layout ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 'calc(100vh - 4rem)' }}>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="w-60 bg-white border-r flex flex-col shrink-0">
          <div className="p-4 border-b">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Panel</p>
            <h2 className="text-base font-bold text-slate-800 mt-0.5">Bảng điều khiển</h2>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {/* Overview */}
            <SidebarBtn
              icon={LayoutDashboard}
              label="Tổng quan"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />

            {/* Function */}
            <SidebarBtn
              icon={Wrench}
              label="Kiểm thử kết nối"
              active={activeTab === 'function'}
              onClick={() => setActiveTab('function')}
            />

            {/* Category — collapsible */}
            <div className="pt-3">
              <button
                onClick={() => setCategoryOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50"
              >
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  Danh mục trang
                </span>
                {categoryOpen
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {categoryOpen && (
                <div className="mt-1 space-y-0.5 pl-2">
                  <SidebarBtn
                    icon={Home}
                    label="Trang chủ"
                    active={activeTab === 'category-home'}
                    onClick={() => setActiveTab('category-home')}
                  />
                  <SidebarBtn
                    icon={Trophy}
                    label="Thành tích"
                    active={activeTab === 'category-achievements'}
                    onClick={() => setActiveTab('category-achievements')}
                  />
                  <SidebarBtn
                    icon={Activity}
                    label="Hoạt động"
                    active={activeTab === 'category-activities'}
                    onClick={() => setActiveTab('category-activities')}
                  />
                  <SidebarBtn
                    icon={FileText}
                    label="Đơn đăng ký"
                    active={activeTab === 'category-apply'}
                    onClick={() => setActiveTab('category-apply')}
                  />
                </div>
              )}
            </div>
          </nav>

          {/* Sidebar footer */}
          <div className="p-3 border-t space-y-0.5">
            {siteConfig?.showAdminLink && (
              <a
                href={siteConfig.frontendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Xem website
              </a>
            )}
            <button
              onClick={() => { setIsAuthenticated(false); setPassword(''); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-5xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewPanel
                metrics={metrics}
                totalSubmissions={totalSubmissions}
                submissions={formSubmissions}
                templates={formTemplates}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'function' && (
              <FunctionPanel authHeaders={authHeaders} />
            )}
            {activeTab === 'category-home' && <CategoryHomePanel />}
            {activeTab === 'category-achievements' && <CategoryAchievementsPanel />}
            {activeTab === 'category-activities' && <CategoryActivitiesPanel />}
            {activeTab === 'category-apply' && (
              <ApplicationFormsAdmin adminPassword={password} />
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Overview
// ─────────────────────────────────────────────────────────────────────────────

function OverviewPanel({
  metrics,
  totalSubmissions,
  submissions,
  templates,
  onNavigate,
}: {
  metrics: VisitMetrics | null;
  totalSubmissions: number;
  submissions: FormSubmission[];
  templates: FormTemplateSummary[];
  onNavigate: (tab: AdminTab) => void;
}) {
  const [activeOverviewSection, setActiveOverviewSection] = useState<'none' | 'forms-results'>('none');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('all');
  const [deptSortOrder, setDeptSortOrder] = useState<'desc' | 'asc'>('desc');
  const [tableSortBy, setTableSortBy] = useState<'submitted_at' | 'department' | 'class_name'>('submitted_at');
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc'>('desc');
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const filteredSubmissions = useMemo(() => {
    if (selectedTemplateId === 'all') return submissions;
    return submissions.filter(item => item.template_id === selectedTemplateId);
  }, [submissions, selectedTemplateId]);

  const departmentStats = useMemo(() => {
    const map = new Map<string, { count: number; completionSum: number }>();

    for (const item of filteredSubmissions) {
      const key = item.department || 'Unknown';
      const current = map.get(key) || { count: 0, completionSum: 0 };
      const personalAnswered = Array.isArray(item.optional_personal_answers)
        ? item.optional_personal_answers.slice(0, 5).filter(a => String(a || '').trim()).length
        : 0;
      const deptAnswered = Array.isArray(item.dept_optional_answers)
        ? item.dept_optional_answers.slice(0, 3).filter(a => String(a || '').trim()).length
        : 0;
      const completionRate = Math.round(((personalAnswered + deptAnswered) / 8) * 100);

      current.count += 1;
      current.completionSum += completionRate;
      map.set(key, current);
    }

    return Array.from(map.entries()).map(([department, values]) => ({
      department,
      count: values.count,
      avgCompletion: Math.round(values.completionSum / Math.max(values.count, 1)),
    }));
  }, [filteredSubmissions]);

  const rankedDepartments = useMemo(() => {
    const sorted = [...departmentStats].sort((a, b) =>
      deptSortOrder === 'desc' ? b.count - a.count : a.count - b.count
    );
    return sorted.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [departmentStats, deptSortOrder]);

  const submissionTrend = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const item of filteredSubmissions) {
      const date = new Date(item.submitted_at);
      if (Number.isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, count]) => ({
        date: date.slice(5),
        count,
      }));
  }, [filteredSubmissions]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredSubmissions];
    rows.sort((a, b) => {
      const va = String((a as any)[tableSortBy] ?? '');
      const vb = String((b as any)[tableSortBy] ?? '');

      if (tableSortBy === 'submitted_at') {
        const ta = new Date(va).getTime();
        const tb = new Date(vb).getTime();
        return tableSortOrder === 'desc' ? tb - ta : ta - tb;
      }

      return tableSortOrder === 'desc'
        ? vb.localeCompare(va)
        : va.localeCompare(vb);
    });
    return rows;
  }, [filteredSubmissions, tableSortBy, tableSortOrder]);

  const verificationRows = useMemo(
    () => sortedRows.slice(0, 8),
    [sortedRows]
  );

  const formsChartConfig = {
    count: {
      label: 'Forms',
      color: '#2563eb',
    },
  };

  const quickLinks = [
    { icon: Home,     label: 'Trang chủ',   desc: 'Hình ảnh & video',  tab: 'category-home'          as AdminTab, color: 'bg-orange-50 text-orange-600' },
    { icon: Trophy,   label: 'Thành tích',  desc: 'Thêm / chỉnh sửa', tab: 'category-achievements'  as AdminTab, color: 'bg-yellow-50 text-yellow-600' },
    { icon: Activity, label: 'Hoạt động',   desc: 'Thêm / chỉnh sửa', tab: 'category-activities'    as AdminTab, color: 'bg-green-50 text-green-600'  },
    { icon: FileText, label: 'Đơn đăng ký', desc: 'Quản lý forms',     tab: 'category-apply'         as AdminTab, color: 'bg-blue-50 text-blue-600'   },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
        <p className="text-sm text-slate-500 mt-1">Thống kê và tổng hợp dữ liệu website</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Lượt truy cập</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{metrics?.visits ?? '—'}</p>
                <p className="text-xs text-slate-400 mt-1">Cập nhật: {metrics?.lastUpdated ?? 'N/A'}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Đơn đã nộp</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{totalSubmissions}</p>
                <p className="text-xs text-slate-400 mt-1">Tổng số đơn đăng ký</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Trạng thái hệ thống</p>
                <p className="text-lg font-semibold text-green-600 mt-1">Hoạt động</p>
                <p className="text-xs text-slate-400 mt-1">Các dịch vụ bình thường</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick navigation */}
      <h2 className="text-base font-semibold text-slate-700 mb-3">Truy cập nhanh</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(({ icon: Icon, label, desc, tab, color }) => (
          <button
            key={tab}
            onClick={() => onNavigate(tab)}
            className="p-4 bg-white rounded-xl border hover:border-blue-200 hover:shadow-sm transition-all text-left group"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => {
            setActiveOverviewSection('forms-results');
            setTimeout(() => {
              document.getElementById('forms-analytics-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
          }}
          className="text-left bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Form Answer Results</p>
              <p className="text-xs text-slate-500 mt-1">Open form analytics, ranking, full table, and answer details.</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </button>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-semibold text-slate-800">Overview Summary</p>
          <p className="text-xs text-slate-500 mt-1">Forms loaded: {templates.length} | Answers loaded: {submissions.length}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">Templates: {templates.length}</Badge>
            <Badge variant="outline">Submissions: {submissions.length}</Badge>
          </div>
        </div>
      </div>

      <div id="forms-analytics-section" className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-700">Forms Analytics</h2>
            <p className="text-xs text-slate-500 mt-0.5">Department performance, ranking, and recent verification snapshots</p>
          </div>
          <Badge variant="outline" className="text-xs">Sample size: {filteredSubmissions.length}</Badge>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-5">
            <div className="grid md:grid-cols-[1.6fr_1fr_1fr] gap-3">
              <div>
                <label className="text-xs text-slate-500">Forms List</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">All forms</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">Table sort field</label>
                <select
                  value={tableSortBy}
                  onChange={(e) => setTableSortBy(e.target.value as 'submitted_at' | 'department' | 'class_name')}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="submitted_at">Submitted time</option>
                  <option value="department">Department</option>
                  <option value="class_name">Class</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">Sort order</label>
                <select
                  value={tableSortOrder}
                  onChange={(e) => setTableSortOrder(e.target.value as 'asc' | 'desc')}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>

            {selectedTemplate && (
              <div className="mt-3 text-xs text-slate-500">
                Selected form: <span className="font-medium text-slate-700">{selectedTemplate.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {activeOverviewSection !== 'forms-results' && (
          <Card className="mb-4">
            <CardContent className="py-10 text-center text-slate-500">
              Click <span className="font-medium text-slate-700">Form Answer Results</span> above to open the visualization section.
            </CardContent>
          </Card>
        )}

        {activeOverviewSection === 'forms-results' && (
          <>

        <div className="grid gap-4 lg:grid-cols-2 mb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Forms by Department</CardTitle>
              <CardDescription>Distribution of completed forms per department</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={formsChartConfig} className="h-[280px] w-full">
                <BarChart data={rankedDepartments} margin={{ left: -8, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={26} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">7-Day Submission Trend</CardTitle>
              <CardDescription>Recent completion trend over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={formsChartConfig} className="h-[280px] w-full">
                <LineChart data={submissionTrend} margin={{ left: -8, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={26} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-count)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_1.9fr]">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Department Ranking</CardTitle>
                  <CardDescription>Sort by completion volume</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeptSortOrder(order => (order === 'desc' ? 'asc' : 'desc'))}
                >
                  Sort: {deptSortOrder === 'desc' ? 'High to Low' : 'Low to High'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Forms</TableHead>
                    <TableHead className="text-right">Avg %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedDepartments.length > 0 ? rankedDepartments.map((item) => (
                    <TableRow key={item.department}>
                      <TableCell className="font-medium">{item.rank}</TableCell>
                      <TableCell>{item.department}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.count}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.avgCompletion}%</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500 py-8">No submissions available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Verification Preview</CardTitle>
              <CardDescription>Latest applicant records with image and answer summary</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Answer Summary</TableHead>
                    <TableHead className="text-right">Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verificationRows.length > 0 ? verificationRows.map((item) => {
                    const personalAnswers = Array.isArray(item.optional_personal_answers)
                      ? item.optional_personal_answers.filter(a => String(a || '').trim())
                      : [];
                    const deptAnswers = Array.isArray(item.dept_optional_answers)
                      ? item.dept_optional_answers.filter(a => String(a || '').trim())
                      : [];
                    const completion = Math.round(((personalAnswers.length + deptAnswers.length) / 8) * 100);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[220px]">
                            <img
                              src={item.photo_url || 'https://placehold.co/48x48?text=N/A'}
                              alt={item.full_name || 'Applicant'}
                              className="w-10 h-10 rounded-lg object-cover border bg-slate-100"
                            />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 truncate">{item.full_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{new Date(item.submitted_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.department || 'Unknown'}</TableCell>
                        <TableCell className="max-w-[280px]">
                          <p className="text-xs text-slate-700 truncate">
                            {personalAnswers[0] || deptAnswers[0] || 'No answer preview'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Personal: {personalAnswers.length}/5 | Department: {deptAnswers.length}/3
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="tabular-nums">{completion}%</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500 py-8">No submissions available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Full Answer Dataset</CardTitle>
            <CardDescription>Excel-style answer table with sorting and a details action per row</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRows.length > 0 ? sortedRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-slate-600">{new Date(row.submitted_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium">{row.full_name || 'Unknown'}</TableCell>
                    <TableCell>{row.department || 'Unknown'}</TableCell>
                    <TableCell>{row.class_name || 'N/A'}</TableCell>
                    <TableCell>{row.student_id || 'N/A'}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{row.email || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetailSubmission(row)}>View detail</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">No submission data for current filter</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      <Dialog open={!!detailSubmission} onOpenChange={(open) => !open && setDetailSubmission(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Candidate Answer Detail</DialogTitle>
            <DialogDescription>
              General detail template: image, profile information, and full question answers.
            </DialogDescription>
          </DialogHeader>

          {detailSubmission && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-[180px_1fr] gap-4">
                <div>
                  <img
                    src={detailSubmission.photo_url || 'https://placehold.co/180x220?text=No+Image'}
                    alt={detailSubmission.full_name || 'Candidate'}
                    className="w-full h-[220px] rounded-lg object-cover border bg-slate-100"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">Name:</span> <span className="font-medium">{detailSubmission.full_name || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Gender:</span> <span className="font-medium">{detailSubmission.gender || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Birth date:</span> <span className="font-medium">{detailSubmission.birth_date || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Department:</span> <span className="font-medium">{detailSubmission.department || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Class:</span> <span className="font-medium">{detailSubmission.class_name || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Student ID:</span> <span className="font-medium">{detailSubmission.student_id || 'N/A'}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">Email:</span> <span className="font-medium">{detailSubmission.email || 'N/A'}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">Submitted at:</span> <span className="font-medium">{new Date(detailSubmission.submitted_at).toLocaleString()}</span></div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Personal Answers (5)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={`p-${i}`} className="text-sm">
                        <p className="text-xs text-slate-500">Q{i + 1}</p>
                        <p className="rounded-md bg-slate-50 border px-2.5 py-2">{detailSubmission.optional_personal_answers?.[i] || 'No answer'}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Department Answers (3)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={`d-${i}`} className="text-sm">
                        <p className="text-xs text-slate-500">Q{i + 1}</p>
                        <p className="rounded-md bg-slate-50 border px-2.5 py-2">{detailSubmission.dept_optional_answers?.[i] || 'No answer'}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Function — API connection testing
// ─────────────────────────────────────────────────────────────────────────────

function FunctionPanel({ authHeaders }: { authHeaders: Record<string, string> }) {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({
    supabase: 'idle', sheets: 'idle', drive: 'idle', ai: 'idle', admin: 'idle',
  });
  const [messages, setMessages] = useState<Record<string, string>>({});

  const runTest = async (
    key: string,
    fn: () => Promise<{ ok: boolean; msg: string }>,
  ) => {
    setStatuses(s => ({ ...s, [key]: 'loading' }));
    try {
      const result = await fn();
      setStatuses(s => ({ ...s, [key]: result.ok ? 'ok' : 'error' }));
      setMessages(m => ({ ...m, [key]: result.msg }));
    } catch (e) {
      setStatuses(s => ({ ...s, [key]: 'error' }));
      setMessages(m => ({ ...m, [key]: String(e) }));
    }
  };

  const getErrorMessage = async (res: Response): Promise<string> => {
    try {
      const payload = await res.json();
      const detail = payload?.message || payload?.error || payload?.details;
      return detail ? `Lỗi HTTP ${res.status}: ${detail}` : `Lỗi HTTP ${res.status}`;
    } catch {
      return `Lỗi HTTP ${res.status}`;
    }
  };

  const services: {
    key: string;
    icon: LucideIcon;
    label: string;
    desc: string;
    bgColor: string;
    iconColor: string;
    onTest: () => Promise<{ ok: boolean; msg: string }>;
  }[] = [
    {
      key: 'supabase',
      icon: Database,
      label: 'Database',
      desc: 'Kiểm tra kết nối cơ sở dữ liệu Supabase',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      onTest: async () => {
        const res = await fetch('/api/admin/application-form-submissions?page=1&pageSize=1', { headers: authHeaders });
        return {
          ok: res.ok,
          msg: res.ok ? 'Kết nối Supabase thành công' : await getErrorMessage(res),
        };
      },
    },
    {
      key: 'sheets',
      icon: FileSpreadsheet,
      label: 'Google Sheets',
      desc: 'Kiểm tra kết nối Google Sheets API',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      onTest: async () => {
        const res = await fetch('/api/admin/form-submissions', { headers: authHeaders });
        return {
          ok: res.ok,
          msg: res.ok ? 'Kết nối Google Sheets thành công' : await getErrorMessage(res),
        };
      },
    },
    {
      key: 'drive',
      icon: FolderOpen,
      label: 'Google Drive',
      desc: 'Kiểm tra kết nối Google Drive API',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      onTest: async () => {
        const res = await fetch('/api/admin/drive-check', { headers: authHeaders });
        return {
          ok: res.ok,
          msg: res.ok ? 'Kết nối Google Drive thành công' : await getErrorMessage(res),
        };
      },
    },
    {
      key: 'ai',
      icon: Bot,
      label: 'AI Api',
      desc: 'Kiểm tra kết nối dịch vụ AI Gemini',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      onTest: async () => {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'ping' }),
        });
        return {
          ok: res.ok,
          msg: res.ok ? 'AI đang hoạt động bình thường' : await getErrorMessage(res),
        };
      },
    },
    {
      key: 'admin',
      icon: ShieldCheck,
      label: 'Admin API',
      desc: 'Kiểm tra xác thực Admin API',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      onTest: async () => {
        const res = await fetch('/api/admin/settings', { headers: authHeaders });
        return {
          ok: res.ok,
          msg: res.ok ? 'Admin API xác thực thành công' : await getErrorMessage(res),
        };
      },
    },
  ];

  const testAll = () => services.forEach(svc => runTest(svc.key, svc.onTest));

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kiểm thử kết nối</h1>
          <p className="text-sm text-slate-500 mt-1">Kiểm tra trạng thái các dịch vụ backend</p>
        </div>
        <Button onClick={testAll} variant="outline" size="sm">
          <Wrench className="w-4 h-4 mr-2" />
          Test tất cả
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {services.map(({ key, icon: Icon, label, desc, bgColor, iconColor, onTest }) => (
          <Card key={key}>
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-medium text-slate-800">{label}</p>
                    <StatusBadge status={statuses[key] as ServiceStatus} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  {messages[key] && (
                    <p className={`text-xs mt-2 ${statuses[key] === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                      {messages[key]}
                    </p>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled={statuses[key] === 'loading'}
                    onClick={() => runTest(key, onTest)}
                  >
                    {statuses[key] === 'loading'
                      ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Đang kiểm tra…</>
                      : 'Kiểm tra'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Breadcrumb helper
// ─────────────────────────────────────────────────────────────────────────────

function Breadcrumb({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-1">
      <FolderOpen className="w-3.5 h-3.5" />
      <span>Danh mục trang</span>
      <ChevronRight className="w-3 h-3" />
      <span className="text-slate-600 font-medium">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category — Home
// ─────────────────────────────────────────────────────────────────────────────

function CategoryHomePanel() {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Trang chủ" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Trang chủ</h1>
        <p className="text-sm text-slate-500 mt-1">Chỉnh sửa nội dung hiển thị trên trang chủ website</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Banner image */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center">
                <ImagePlus className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-base">Hình ảnh Banner</CardTitle>
                <CardDescription className="text-xs mt-0.5">Ảnh nền và carousel trang chủ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 h-28 flex flex-col items-center justify-center mb-3">
              <ImagePlus className="w-7 h-7 text-slate-300 mb-1.5" />
              <p className="text-xs text-slate-400">Chức năng đang phát triển</p>
            </div>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <ImagePlus className="w-4 h-4 mr-2" />
              Chỉnh sửa hình ảnh
            </Button>
          </CardContent>
        </Card>

        {/* Featured video */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
                <Video className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-base">Video nổi bật</CardTitle>
                <CardDescription className="text-xs mt-0.5">Video YouTube hiển thị trên trang chủ</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 h-28 flex flex-col items-center justify-center mb-3">
              <Video className="w-7 h-7 text-slate-300 mb-1.5" />
              <p className="text-xs text-slate-400">Chức năng đang phát triển</p>
            </div>
            <Button variant="outline" size="sm" className="w-full" disabled>
              <Video className="w-4 h-4 mr-2" />
              Chỉnh sửa video
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category — Achievements
// ─────────────────────────────────────────────────────────────────────────────

function CategoryAchievementsPanel() {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Thành tích" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Thành tích</h1>
        <p className="text-sm text-slate-500 mt-1">Thêm, sửa và quản lý các thành tích của đoàn</p>
      </div>

      <div className="flex justify-end mb-4">
        <Button disabled>
          <PlusCircle className="w-4 h-4 mr-2" />
          Thêm thành tích mới
        </Button>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Chức năng đang phát triển</p>
          <p className="text-sm text-slate-400 mt-1">Danh sách thành tích sẽ hiển thị ở đây</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category — Activities
// ─────────────────────────────────────────────────────────────────────────────

function CategoryActivitiesPanel() {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Hoạt động" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Hoạt động</h1>
        <p className="text-sm text-slate-500 mt-1">Thêm, sửa và quản lý các chương trình hoạt động</p>
      </div>

      <div className="flex justify-end mb-4">
        <Button disabled>
          <PlusCircle className="w-4 h-4 mr-2" />
          Thêm hoạt động mới
        </Button>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Chức năng đang phát triển</p>
          <p className="text-sm text-slate-400 mt-1">Danh sách hoạt động sẽ hiển thị ở đây</p>
        </CardContent>
      </Card>
    </div>
  );
}
