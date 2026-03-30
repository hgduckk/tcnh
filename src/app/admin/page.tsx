// ─────────────────────────────────────────────────────────────────────────────
// Admin Page — redesigned with Overview / Function / Category structure
// ─────────────────────────────────────────────────────────────────────────────
"use client";

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  LogOut, Eye, ClipboardList,
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
  status?: string;
  standing_committee_comment?: string;
  board_comment?: string;
}

const CANDIDATE_STATUS = {
  not_selected: { label: 'Chưa chọn',   circleColor: 'bg-gray-400',   textColor: 'text-gray-500',   btnActive: 'border-gray-400 bg-gray-50 ring-gray-300'   },
  accepted:     { label: 'Nhận',         circleColor: 'bg-green-500',  textColor: 'text-green-600',  btnActive: 'border-green-400 bg-green-50 ring-green-300'  },
  undecided:    { label: 'Chưa quyết định', circleColor: 'bg-yellow-400', textColor: 'text-yellow-600', btnActive: 'border-yellow-400 bg-yellow-50 ring-yellow-300' },
  rejected:     { label: 'Loại',         circleColor: 'bg-red-500',    textColor: 'text-red-600',    btnActive: 'border-red-400 bg-red-50 ring-red-300'     },
} as const;
type CandidateStatus = keyof typeof CANDIDATE_STATUS;

interface FormTemplateSummary {
  id: string;
  name: string;
  open_at: string;
  close_at: string;
  optional_personal_questions?: string[];
  department_questions?: Record<string, string[]>;
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
  const [loadingData, setLoadingData] = useState(false);

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

  const reloadData = async (headers: Record<string, string>) => {
    setLoadingData(true);
    try {
      const [metricsRes, subsRes, formsRes] = await Promise.all([
        fetch('/api/admin/visits', { headers }),
        fetch('/api/admin/application-form-submissions?includeAll=true', { headers }),
        fetch('/api/admin/forms', { headers }),
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
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    reloadData(authHeaders);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
                authHeaders={authHeaders}
                onReload={() => reloadData(authHeaders)}
                loadingData={loadingData}
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
  authHeaders,
  onReload,
  loadingData,
}: {
  metrics: VisitMetrics | null;
  totalSubmissions: number;
  submissions: FormSubmission[];
  templates: FormTemplateSummary[];
  onNavigate: (tab: AdminTab) => void;
  authHeaders: Record<string, string>;
  onReload: () => void;
  loadingData: boolean;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('all');
  const [tableSortBy, setTableSortBy] = useState<'submitted_at' | 'full_name' | 'department' | 'class_name' | 'student_id' | 'email'>('submitted_at');
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tableSearch, setTableSearch] = useState('');
  const [tableDepartmentFilter, setTableDepartmentFilter] = useState('all');
  const [tableClassFilter, setTableClassFilter] = useState('all');
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);

  // ── Inline submission updates (status + comments) ──────────────────────────
  const [submissionUpdates, setSubmissionUpdates] = useState<Record<string, { status: CandidateStatus; standingComment: string; boardComment: string }>>({});
  const [dialogStatus, setDialogStatus] = useState<CandidateStatus>('not_selected');
  const [dialogStandingComment, setDialogStandingComment] = useState('');
  const [dialogBoardComment, setDialogBoardComment] = useState('');
  const [savingDetail, setSavingDetail] = useState(false);
  const [saveDetailError, setSaveDetailError] = useState<string | null>(null);
  const [saveDetailSuccess, setSaveDetailSuccess] = useState(false);
  const [detailTemplate, setDetailTemplate] = useState<FormTemplateSummary | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

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

  const departmentFilterOptions = useMemo(() => {
    return Array.from(
      new Set(filteredSubmissions.map((item) => (item.department || 'Unknown').trim() || 'Unknown'))
    ).sort((a, b) => a.localeCompare(b));
  }, [filteredSubmissions]);

  const classFilterOptions = useMemo(() => {
    return Array.from(
      new Set(filteredSubmissions.map((item) => (item.class_name || 'N/A').trim() || 'N/A'))
    ).sort((a, b) => a.localeCompare(b));
  }, [filteredSubmissions]);

  const excelRows = useMemo(() => {
    const search = tableSearch.trim().toLowerCase();
    return sortedRows.filter((row) => {
      const department = (row.department || 'Unknown').trim() || 'Unknown';
      const className = (row.class_name || 'N/A').trim() || 'N/A';

      if (tableDepartmentFilter !== 'all' && department !== tableDepartmentFilter) {
        return false;
      }

      if (tableClassFilter !== 'all' && className !== tableClassFilter) {
        return false;
      }

      if (!search) return true;

      const haystack = [
        row.full_name,
        row.department,
        row.class_name,
        row.student_id,
        row.email,
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');

      return haystack.includes(search);
    });
  }, [sortedRows, tableSearch, tableDepartmentFilter, tableClassFilter]);

  const onHeaderSort = (column: 'submitted_at' | 'full_name' | 'department' | 'class_name' | 'student_id' | 'email') => {
    if (tableSortBy === column) {
      setTableSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setTableSortBy(column);
    setTableSortOrder(column === 'submitted_at' ? 'desc' : 'asc');
  };

  const getEffectiveStatus = (row: FormSubmission): CandidateStatus => {
    const update = submissionUpdates[row.id];
    if (update) return update.status;
    const raw = row.status ?? 'not_selected';
    return (raw in CANDIDATE_STATUS ? raw : 'not_selected') as CandidateStatus;
  };

  const openDetail = async (row: FormSubmission) => {
    const update = submissionUpdates[row.id];
    setDialogStatus(update?.status ?? (row.status as CandidateStatus | undefined) ?? 'not_selected');
    setDialogStandingComment(update?.standingComment ?? row.standing_committee_comment ?? '');
    setDialogBoardComment(update?.boardComment ?? row.board_comment ?? '');
    setSaveDetailError(null);
    setSaveDetailSuccess(false);
    setDetailTemplate(templates.find(t => t.id === row.template_id) ?? null);
    setDetailSubmission(row);
    // Fetch full template (including question data) in background
    if (row.template_id) {
      setLoadingTemplate(true);
      try {
        const res = await fetch(`/api/admin/forms/${row.template_id}`, { headers: authHeaders });
        if (res.ok) {
          const payload = await res.json();
          if (payload?.data) setDetailTemplate(payload.data);
        }
      } catch { /* ignore */ } finally {
        setLoadingTemplate(false);
      }
    }
  };

  const saveDetailChanges = async () => {
    if (!detailSubmission) return;
    setSavingDetail(true);
    setSaveDetailError(null);
    setSaveDetailSuccess(false);
    try {
      const res = await fetch(`/api/admin/application-form-submissions/${detailSubmission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          status: dialogStatus,
          standing_committee_comment: dialogStandingComment,
          board_comment: dialogBoardComment,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || `Lỗi ${res.status}`);
      }
      setSubmissionUpdates(prev => ({
        ...prev,
        [detailSubmission.id]: {
          status: dialogStatus,
          standingComment: dialogStandingComment,
          boardComment: dialogBoardComment,
        },
      }));
      setSaveDetailSuccess(true);
    } catch (e) {
      setSaveDetailError(String(e instanceof Error ? e.message : e));
    } finally {
      setSavingDetail(false);
    }
  };

  const quickLinks = [
    { icon: Home,     label: 'Trang chủ',   desc: 'Hình ảnh & video',  tab: 'category-home'          as AdminTab, color: 'bg-orange-50 text-orange-600' },
    { icon: Trophy,   label: 'Thành tích',  desc: 'Thêm / chỉnh sửa', tab: 'category-achievements'  as AdminTab, color: 'bg-yellow-50 text-yellow-600' },
    { icon: Activity, label: 'Hoạt động',   desc: 'Thêm / chỉnh sửa', tab: 'category-activities'    as AdminTab, color: 'bg-green-50 text-green-600'  },
    { icon: FileText, label: 'Đơn đăng ký', desc: 'Quản lý forms',     tab: 'category-apply'         as AdminTab, color: 'bg-blue-50 text-blue-600'   },
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
          <p className="text-sm text-slate-500 mt-1">Thống kê và tổng hợp dữ liệu website</p>
        </div>
        <Button variant="outline" size="sm" onClick={onReload} disabled={loadingData} className="shrink-0 mt-1">
          {loadingData
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Đang tải…</>
            : <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>Làm mới dữ liệu</>}
        </Button>
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

      <div id="forms-analytics-section" className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-700">Dữ liệu đơn đăng ký</h2>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-5">
            <div className="grid md:grid-cols-[1.2fr_1fr_1fr] gap-3">
              <div>
                <label className="text-xs text-slate-500">Đơn đăng ký</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Chọn form...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">Sắp xếp theo</label>
                <select
                  value={tableSortBy}
                  onChange={(e) => setTableSortBy(e.target.value as 'submitted_at' | 'full_name' | 'department' | 'class_name' | 'student_id' | 'email')}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="submitted_at">Thời gian</option>
                  <option value="full_name">Tên</option>
                  <option value="department">Ban</option>
                  <option value="class_name">Lớp</option>
                  <option value="student_id">MSSV</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500">Thứ tự</label>
                <select
                  value={tableSortOrder}
                  onChange={(e) => setTableSortOrder(e.target.value as 'asc' | 'desc')}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
              </div>
            </div>

            {selectedTemplate && (
              <div className="mt-3 text-xs text-slate-500">
                Đơn đăng ký đã chọn: <span className="font-medium text-slate-700">{selectedTemplate.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTemplateId === 'all' && (
          <Card className="mb-4">
            <CardContent className="py-10 text-center text-slate-500">
              Chọn một template form để hiển thị <span className="font-medium text-slate-700">Danh sách câu trả lời</span>.
            </CardContent>
          </Card>
        )}

        {selectedTemplateId !== 'all' && (
          <>
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Danh sách câu trả lời</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 mb-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
              <Input
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Tìm theo tên, ban, lớp, MSSV, email..."
              />

              <select
                value={tableDepartmentFilter}
                onChange={(e) => setTableDepartmentFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Ban</option>
                {departmentFilterOptions.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>

              <select
                value={tableClassFilter}
                onChange={(e) => setTableClassFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Lớp</option>
                {classFilterOptions.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>

              <Button
                variant="outline"
                onClick={() => {
                  setTableSearch('');
                  setTableDepartmentFilter('all');
                  setTableClassFilter('all');
                }}
              >
                Xóa
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">
                    <button type="button" className="w-full text-center" onClick={() => onHeaderSort('submitted_at')}>
                      Thời gian {tableSortBy === 'submitted_at' ? (tableSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button type="button" className="w-full text-center" onClick={() => onHeaderSort('full_name')}>
                      Tên {tableSortBy === 'full_name' ? (tableSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button type="button" className="w-full text-center" onClick={() => onHeaderSort('department')}>
                      Ban {tableSortBy === 'department' ? (tableSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button type="button" className="w-full text-center" onClick={() => onHeaderSort('class_name')}>
                      Lớp {tableSortBy === 'class_name' ? (tableSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button type="button" className="w-full text-center" onClick={() => onHeaderSort('student_id')}>
                      MSSV {tableSortBy === 'student_id' ? (tableSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">
                    <button type="button" className="w-full text-center" onClick={() => onHeaderSort('email')}>
                      Email {tableSortBy === 'email' ? (tableSortOrder === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excelRows.length > 0 ? excelRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs text-slate-600 text-center">{new Date(row.submitted_at).toLocaleString()}</TableCell>
                    <TableCell className="font-medium ">{row.full_name || 'Unknown'}</TableCell>
                    <TableCell className="text-center">{row.department || 'Unknown'}</TableCell>
                    <TableCell className="text-center">{row.class_name || 'N/A'}</TableCell>
                    <TableCell className="text-center">{row.student_id || 'N/A'}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{row.email || 'N/A'}</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const effectiveStatus = getEffectiveStatus(row);
                        const cfg = CANDIDATE_STATUS[effectiveStatus];
                        return (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.circleColor}`} />
                            <span className={`text-xs ${cfg.textColor}`}>{cfg.label}</span>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetail(row)}>Chi tiết</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-slate-500 py-8">No submission data for current filter</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      <Dialog open={!!detailSubmission} onOpenChange={(open) => { if (!open) { setDetailSubmission(null); setDetailTemplate(null); } }}>
        <DialogContent className="inset-0 left-0 top-0 translate-x-0 translate-y-0 m-auto w-[calc(100%-2rem)] max-w-5xl h-fit max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              THÔNG TIN CÁ NHÂN
              {loadingTemplate && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </DialogTitle>
            <DialogDescription>
              Thông tin hồ sơ, câu trả lời, đánh giá và nhận xét.
            </DialogDescription>
          </DialogHeader>

          {detailSubmission && (
            <div className="space-y-5">
              {/* ── Profile header ── */}
              <div className="grid md:grid-cols-[180px_1fr] gap-4">
                <div>
                  <img
                    src={detailSubmission.photo_url || 'https://placehold.co/180x220?text=No+Image'}
                    alt={detailSubmission.full_name || 'Candidate'}
                    className="w-full h-[220px] rounded-lg object-cover border bg-slate-100"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm mt-4">
                  <div><span className="text-slate-500">Họ tên:</span> <span className="font-medium">{detailSubmission.full_name || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Giới tính:</span> <span className="font-medium">{detailSubmission.gender || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Ngày sinh:</span> <span className="font-medium">{detailSubmission.birth_date || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Ban:</span> <span className="font-medium">{detailSubmission.department || 'N/A'}</span></div>
                  <div><span className="text-slate-500">Lớp:</span> <span className="font-medium">{detailSubmission.class_name || 'N/A'}</span></div>
                  <div><span className="text-slate-500">MSSV:</span> <span className="font-medium">{detailSubmission.student_id || 'N/A'}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">Email:</span> <span className="font-medium">{detailSubmission.email || 'N/A'}</span></div>
                  <div className="sm:col-span-2"><span className="text-slate-500">Thời gian nộp:</span> <span className="font-medium">{new Date(detailSubmission.submitted_at).toLocaleString()}</span></div>
                </div>
              </div>

              {/* ── Answers ── */}
              {(() => {
                const tmpl = detailTemplate;
                const personalQs: string[] = Array.isArray(tmpl?.optional_personal_questions)
                  ? (tmpl!.optional_personal_questions as string[]).filter((q: string) => q?.trim())
                  : [];
                const deptQs: string[] = Array.isArray(tmpl?.department_questions?.[detailSubmission.department])
                  ? (tmpl!.department_questions![detailSubmission.department] as string[]).filter((q: string) => q?.trim())
                  : [];
                const personalCount = personalQs.length || detailSubmission.optional_personal_answers?.length || 0;
                const deptCount = deptQs.length || detailSubmission.dept_optional_answers?.length || 0;
                return (
                  <>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Câu hỏi cá nhân ({personalCount} câu)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Array.from({ length: personalCount }).map((_, i) => (
                          <div key={`p-${i}`} className="text-sm">
                            {personalQs[i] && (
                              <p className="text-xs font-medium text-slate-600 mb-1">Câu {i + 1}: {personalQs[i]}</p>
                            )}
                            {!personalQs[i] && (
                              <p className="text-xs text-slate-400 mb-1">Câu {i + 1}</p>
                            )}
                            <p className="rounded-md bg-slate-50 border px-2.5 py-2 text-slate-700">{detailSubmission.optional_personal_answers?.[i] || <span className="text-slate-400 italic">Chưa trả lời</span>}</p>
                          </div>
                        ))}
                        {personalCount === 0 && <p className="text-xs text-slate-400 italic">Không có câu hỏi cá nhân</p>}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Câu hỏi ban — {detailSubmission.department} ({deptCount} câu)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Array.from({ length: deptCount }).map((_, i) => (
                          <div key={`d-${i}`} className="text-sm">
                            {deptQs[i] && (
                              <p className="text-xs font-medium text-slate-600 mb-1">Câu {i + 1}: {deptQs[i]}</p>
                            )}
                            {!deptQs[i] && (
                              <p className="text-xs text-slate-400 mb-1">Câu {i + 1}</p>
                            )}
                            <p className="rounded-md bg-slate-50 border px-2.5 py-2 text-slate-700">{detailSubmission.dept_optional_answers?.[i] || <span className="text-slate-400 italic">Chưa trả lời</span>}</p>
                          </div>
                        ))}
                        {deptCount === 0 && <p className="text-xs text-slate-400 italic">Không có câu hỏi ban</p>}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}

              {/* ── Standing Committee comment ── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Nhận xét Ban Thường Vụ</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={dialogStandingComment}
                    onChange={(e) => setDialogStandingComment(e.target.value)}
                    placeholder="Nhập nhận xét của Ban Thường Vụ sau khi phỏng vấn..."
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              {/* ── Board comment ── */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Nhận xét Ban Chuyên môn</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={dialogBoardComment}
                    onChange={(e) => setDialogBoardComment(e.target.value)}
                    placeholder="Nhập nhận xét của Ban Chuyên môn sau khi phỏng vấn..."
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              {/* ── Status picker ── */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Trạng thái ứng viên</h4>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(CANDIDATE_STATUS) as [CandidateStatus, typeof CANDIDATE_STATUS[CandidateStatus]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDialogStatus(key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        dialogStatus === key
                          ? `${cfg.btnActive} ring-2 ring-offset-1`
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.circleColor}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Save area ── */}
              {saveDetailError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{saveDetailError}</p>
              )}
              {saveDetailSuccess && (
                <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">Đã lưu thành công!</p>
              )}
              <div className="flex justify-end">
                <Button onClick={saveDetailChanges} disabled={savingDetail}>
                  {savingDetail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang lưu…</> : 'Lưu thay đổi'}
                </Button>
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
