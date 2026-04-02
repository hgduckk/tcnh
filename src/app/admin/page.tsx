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
import { AchievementsAdmin } from '@/components/admin/AchievementsAdmin';
import { ActivitiesAdmin } from '@/components/admin/ActivitiesAdmin';
import { PartnersAdmin } from '@/components/admin/PartnersAdmin';
import { StructureAdmin } from '@/components/admin/StructureAdmin';
import { BlogTestimonialsAdmin } from '@/components/admin/BlogTestimonialsAdmin';
import { BlogDiscussionAdmin } from '@/components/admin/BlogDiscussionAdmin';
import { formatDateTime } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import {
  LayoutDashboard, Wrench, FolderOpen, Home, Trophy, Activity, FileText,
  ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Loader2,
  ImagePlus, Video, PlusCircle, Database, Bot, FileSpreadsheet, ShieldCheck,
  LogOut, Eye, ClipboardList, Users, MessageSquare, Quote,
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
  accepted:     { label: 'Đồng ý',         circleColor: 'bg-green-500',  textColor: 'text-green-600',  btnActive: 'border-green-400 bg-green-50 ring-green-300'  },
  undecided:    { label: 'Xem xét', circleColor: 'bg-yellow-400', textColor: 'text-yellow-600', btnActive: 'border-yellow-400 bg-yellow-50 ring-yellow-300' },
  rejected:     { label: 'Loại',         circleColor: 'bg-red-500',    textColor: 'text-red-600',    btnActive: 'border-red-400 bg-red-50 ring-red-300'     },
} as const;
type CandidateStatus = keyof typeof CANDIDATE_STATUS;

const STATUS_PIE_COLORS: Record<CandidateStatus, string> = {
  not_selected: '#9ca3af',
  accepted:     '#22c55e',
  undecided:    '#f59e0b',
  rejected:     '#ef4444',
};
const DEPT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
const BAR_PALETTE = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4', '#84cc16', '#f97316'];
const GENDER_PIE_COLORS = ['#3b82f6', '#ec4899', '#a78bfa', '#9ca3af', '#f97316'];

interface FormTemplateSummary {
  id: string;
  name: string;
  open_at: string;
  close_at: string;
  optional_personal_questions?: string[];
  department_questions?: Record<string, string[]>;
  class_options?: string[];
}

type AdminTab =
  | 'overview'
  | 'function'
  | 'category-home'
  | 'category-structure'
  | 'category-achievements'
  | 'category-activities'
  | 'category-apply'
  | 'category-partners'
  | 'category-blog-testimonials'
  | 'category-blog-discussions';

type ServiceStatus = 'idle' | 'loading' | 'ok' | 'error';

const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  submit_index: 60,
  full_name: 150,
  class_name: 120,
  department: 130,
  status: 130,
  student_id: 120,
  email: 180,
  birth_date: 120,
  gender: 100,
  submitted_at: 170,
  details: 96,
};

// ── Resizable Table Header Cell ───────────────────────────────────────────────

interface ResizableHeaderCell {
  column: string;
  label: string;
  width: number;
  onResize: (delta: number) => void;
  onSort?: () => void;
  isSorted?: boolean;
  sortOrder?: 'asc' | 'desc';
  className?: string;
}

function ResizableTableHeaderCell({ column, label, width, onResize, onSort, isSorted, sortOrder, className }: ResizableHeaderCell) {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      onResize(delta);
      setStartX(e.clientX);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, startX, onResize]);

  return (
    <TableHead
      data-column={column}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}
      className={`relative whitespace-nowrap border-b border-blue-700 bg-gradient-to-b from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all ${className ?? ''}`}
    >
      <div className="flex h-full items-center px-2 pr-4">
        <button
          type="button"
          onClick={onSort}
          disabled={!onSort}
          className={`min-w-0 flex-1 truncate whitespace-nowrap py-2 text-center text-xs font-semibold uppercase tracking-wider transition-colors ${
            onSort ? 'hover:text-blue-100' : 'cursor-default'
          }`}
        >
          {label} {isSorted ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
        </button>
        <div
          onMouseDown={handleMouseDown}
          className={`absolute right-0 top-0 h-full w-2 bg-white/60 opacity-0 hover:opacity-100 cursor-col-resize transition-opacity ${
            isResizing ? 'opacity-100' : ''
          }`}
        />
      </div>
    </TableHead>
  );
}

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex flex-col items-center justify-center p-4">
        <img src="/images/logo.png" alt="ĐKTCNH Logo" className="h-14 w-auto mb-8" />
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
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: '100vh' }}>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="w-60 bg-white border-r flex flex-col shrink-0">
          <div className="p-4 border-b flex flex-col items-center gap-2">
            <img src="/images/logo.png" alt="ĐKTCNH Logo" className="h-8 w-auto" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Panel</p>
            <h2 className="text-base font-bold text-slate-800">Bảng điều khiển</h2>
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
                    icon={FolderOpen}
                    label="Cơ cấu"
                    active={activeTab === 'category-structure'}
                    onClick={() => setActiveTab('category-structure')}
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
                  <SidebarBtn
                    icon={Users}
                    label="Đơn vị hợp tác"
                    active={activeTab === 'category-partners'}
                    onClick={() => setActiveTab('category-partners')}
                  />
                  <SidebarBtn
                    icon={Quote}
                    label="Lời gửi gắm"
                    active={activeTab === 'category-blog-testimonials'}
                    onClick={() => setActiveTab('category-blog-testimonials')}
                  />
                  <SidebarBtn
                    icon={MessageSquare}
                    label="Diễn đàn"
                    active={activeTab === 'category-blog-discussions'}
                    onClick={() => setActiveTab('category-blog-discussions')}
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
                authHeaders={authHeaders}
                onReload={() => reloadData(authHeaders)}
                loadingData={loadingData}
              />
            )}
            {activeTab === 'function' && (
              <FunctionPanel authHeaders={authHeaders} />
            )}
            {activeTab === 'category-home' && <CategoryHomePanel />}
            {activeTab === 'category-structure' && <CategoryStructurePanel adminPassword={password} />}
            {activeTab === 'category-achievements' && <CategoryAchievementsPanel adminPassword={password} />}
            {activeTab === 'category-activities' && <CategoryActivitiesPanel adminPassword={password} />}
            {activeTab === 'category-apply' && (
              <ApplicationFormsAdmin adminPassword={password} />
            )}
            {activeTab === 'category-partners' && <CategoryPartnersPanel adminPassword={password} />}
            {activeTab === 'category-blog-testimonials' && <CategoryBlogTestimonialsPanel adminPassword={password} />}
            {activeTab === 'category-blog-discussions' && <CategoryBlogDiscussionsPanel adminPassword={password} />}
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
  authHeaders,
  onReload,
  loadingData,
}: {
  metrics: VisitMetrics | null;
  totalSubmissions: number;
  submissions: FormSubmission[];
  templates: FormTemplateSummary[];
  authHeaders: Record<string, string>;
  onReload: () => void;
  loadingData: boolean;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('all');
  const [tableSortBy, setTableSortBy] = useState<'submitted_at' | 'full_name' | 'department' | 'class_name' | 'student_id' | 'email' | 'status'>('submitted_at');
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc'>('desc');
  const [tableSearch, setTableSearch] = useState('');
  const [tableDepartmentFilter, setTableDepartmentFilter] = useState('all');
  const [tableClassFilter, setTableClassFilter] = useState('all');
  const [tableStatusFilter, setTableStatusFilter] = useState<'all' | CandidateStatus>('all');
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);
  const [selectedAdditionalFields, setSelectedAdditionalFields] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(DEFAULT_COLUMN_WIDTHS);

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
  const [showFormsAnalytics, setShowFormsAnalytics] = useState(false);

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
      if (tableSortBy === 'submitted_at') {
        const ta = new Date(a.submitted_at).getTime();
        const tb = new Date(b.submitted_at).getTime();
        return tableSortOrder === 'desc' ? tb - ta : ta - tb;
      }

      if (tableSortBy === 'status') {
        const statusOrder = ['not_selected', 'undecided', 'accepted', 'rejected'];
        const statusA = (a.status as string) || 'not_selected';
        const statusB = (b.status as string) || 'not_selected';
        const indexA = statusOrder.indexOf(statusA);
        const indexB = statusOrder.indexOf(statusB);
        return tableSortOrder === 'desc' ? indexB - indexA : indexA - indexB;
      }

      const va = String((a as any)[tableSortBy] ?? '');
      const vb = String((b as any)[tableSortBy] ?? '');

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

  const getEffectiveStatus = (row: FormSubmission): CandidateStatus => {
    const update = submissionUpdates[row.id];
    if (update) return update.status;
    const raw = row.status ?? 'not_selected';
    return (raw in CANDIDATE_STATUS ? raw : 'not_selected') as CandidateStatus;
  };

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

      if (tableStatusFilter !== 'all' && getEffectiveStatus(row) !== tableStatusFilter) {
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
  }, [sortedRows, tableSearch, tableDepartmentFilter, tableClassFilter, tableStatusFilter, submissionUpdates]);

  const onHeaderSort = (column: 'submitted_at' | 'full_name' | 'department' | 'class_name' | 'student_id' | 'email' | 'status') => {
    if (tableSortBy === column) {
      setTableSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setTableSortBy(column);
    setTableSortOrder(column === 'submitted_at' ? 'desc' : 'asc');
  };

  const getColumnWidth = (column: string) => columnWidths[column] ?? DEFAULT_COLUMN_WIDTHS[column] ?? 120;

  const handleColumnResize = (column: string, delta: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(60, (prev[column] ?? DEFAULT_COLUMN_WIDTHS[column] ?? 120) + delta),
    }));
  };

  const tableWidth = useMemo(() => {
    const visibleColumns = [
      'submit_index',
      'full_name',
      'class_name',
      'department',
      'status',
      ...selectedAdditionalFields,
      'details',
    ];

    return visibleColumns.reduce((total, column) => total + getColumnWidth(column), 0);
  }, [columnWidths, selectedAdditionalFields]);

  const genderStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of filteredSubmissions) {
      const g = (row.gender || 'Không rõ').trim() || 'Không rõ';
      map.set(g, (map.get(g) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredSubmissions]);

  const classStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of filteredSubmissions) {
      const c = (row.class_name || 'N/A').trim() || 'N/A';
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredSubmissions]);

  const statusStats = useMemo(() => {
    const map: Record<CandidateStatus, number> = { not_selected: 0, accepted: 0, undecided: 0, rejected: 0 };
    for (const row of filteredSubmissions) {
      const s = getEffectiveStatus(row);
      map[s] = (map[s] ?? 0) + 1;
    }
    return (Object.entries(map) as [CandidateStatus, number][]).map(([key, value]) => ({
      name: CANDIDATE_STATUS[key].label,
      value,
      key,
    }));
  }, [filteredSubmissions, submissionUpdates]);

  const acceptedByDepartment = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of filteredSubmissions) {
      if (getEffectiveStatus(row) === 'accepted') {
        const dept = (row.department || 'Unknown').trim();
        map.set(dept, (map.get(dept) ?? 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([department, count]) => ({ department, count }));
  }, [filteredSubmissions, submissionUpdates]);

  const acceptedCandidatesByDept = useMemo(() => {
    const map = new Map<string, FormSubmission[]>();
    for (const row of filteredSubmissions) {
      if (getEffectiveStatus(row) === 'accepted') {
        const dept = (row.department || 'Unknown').trim();
        if (!map.has(dept)) map.set(dept, []);
        map.get(dept)!.push(row);
      }
    }
    return Array.from(map.entries())
      .map(([dept, candidates]) => ({ dept, candidates }))
      .sort((a, b) => a.dept.localeCompare(b.dept));
  }, [filteredSubmissions, submissionUpdates]);

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

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleOpenFormsAnalytics = () => {
    if (!showFormsAnalytics) {
      setShowFormsAnalytics(true);
      setTimeout(() => scrollToSection('forms-analytics-section'), 80);
      return;
    }
    scrollToSection('forms-analytics-section');
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tổng quan</h1>
          <p className="text-sm text-slate-500 mt-1">Thống kê và tổng hợp dữ liệu</p>
        </div>
        <Button variant="outline" size="sm" onClick={onReload} disabled={loadingData} className="shrink-0 mt-1">
          {loadingData
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Đang tải…</>
            : <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>Reload</>}
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

      {/* Visual navigation */}
      <h2 className="text-base font-semibold text-slate-700 mb-3">Tính năng</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={handleOpenFormsAnalytics}
          className="p-4 bg-white rounded-xl border hover:border-blue-200 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-blue-50 text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700 group-hover:text-blue-700">Đơn đăng ký</p>
          <p className="text-xs text-slate-400 mt-0.5">Hiển thị danh sách và phân tích đơn</p>
        </button>

        <button
          onClick={() => scrollToSection('candidate-stats-section')}
          className="p-4 bg-white rounded-xl border hover:border-violet-200 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-violet-50 text-violet-600">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700 group-hover:text-violet-700">Dữ liệu ứng viên</p>
          <p className="text-xs text-slate-400 mt-0.5">Theo ban, giới tính và lớp</p>
        </button>

        <button
          onClick={() => scrollToSection('recruitment-results-section')}
          className="p-4 bg-white rounded-xl border hover:border-emerald-200 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">Kết quả tuyển</p>
          <p className="text-xs text-slate-400 mt-0.5">Thống kê trạng thái ứng viên</p>
        </button>

        <button
          onClick={() => scrollToSection('accepted-candidates-section')}
          className="p-4 bg-white rounded-xl border hover:border-amber-200 hover:shadow-sm transition-all text-left group"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-amber-50 text-amber-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-700 group-hover:text-amber-700">Tân cộng tác viên</p>
          <p className="text-xs text-slate-400 mt-0.5">Danh sách trúng tuyển theo ban</p>
        </button>
      </div>

      {showFormsAnalytics && (
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
                  onChange={(e) => setTableSortBy(e.target.value as 'submitted_at' | 'full_name' | 'department' | 'class_name' | 'student_id' | 'email' | 'status')}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="submitted_at">Thời gian</option>
                  <option value="full_name">Tên</option>
                  <option value="department">Ban</option>
                  <option value="class_name">Lớp</option>
                  <option value="student_id">MSSV</option>
                  <option value="email">Email</option>
                  <option value="status">Trạng thái</option>
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
            <CardContent className="py-10 text-center text-slate-500 italic">
              Chọn một Đơn đăng ký để hiển thị <span className="font-medium text-slate-700">Danh sách câu trả lời</span>.
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
            <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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

              <select
                value={tableStatusFilter}
                onChange={(e) => setTableStatusFilter(e.target.value as 'all' | CandidateStatus)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">Trạng thái</option>
                {(Object.entries(CANDIDATE_STATUS) as [CandidateStatus, typeof CANDIDATE_STATUS[CandidateStatus]][]).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>

              <Button
                variant="outline"
                onClick={() => {
                  setTableSearch('');
                  setTableDepartmentFilter('all');
                  setTableClassFilter('all');
                  setTableStatusFilter('all');
                }}
              >
                Xóa
              </Button>
            </div>
          
            {/* Additional Fields Selector */}
            <div className="flex flex-wrap gap-2 mb-3">
              {['student_id', 'email', 'birth_date', 'gender', 'submitted_at'].map((field) => {
                const label = {
                  'student_id': 'MSSV',
                  'email': 'Email',
                  'birth_date': 'Ngày sinh',
                  'gender': 'Giới tính',
                  'submitted_at': 'Thời gian nộp',
                }[field] || field;
                const isSelected = selectedAdditionalFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => {
                      setSelectedAdditionalFields(prev =>
                        isSelected
                          ? prev.filter(f => f !== field)
                          : [...prev, field]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Resizable Table */}
            <div className="relative overflow-x-auto rounded-lg border bg-white">
              <table className="min-w-full table-fixed border-separate border-spacing-0" style={{ width: `${tableWidth}px` }}>
                <colgroup>
                  <col style={{ width: `${getColumnWidth('submit_index')}px` }} />
                  <col style={{ width: `${getColumnWidth('full_name')}px` }} />
                  <col style={{ width: `${getColumnWidth('class_name')}px` }} />
                  <col style={{ width: `${getColumnWidth('department')}px` }} />
                  <col style={{ width: `${getColumnWidth('status')}px` }} />
                  {selectedAdditionalFields.includes('student_id') && <col style={{ width: `${getColumnWidth('student_id')}px` }} />}
                  {selectedAdditionalFields.includes('email') && <col style={{ width: `${getColumnWidth('email')}px` }} />}
                  {selectedAdditionalFields.includes('birth_date') && <col style={{ width: `${getColumnWidth('birth_date')}px` }} />}
                  {selectedAdditionalFields.includes('gender') && <col style={{ width: `${getColumnWidth('gender')}px` }} />}
                  {selectedAdditionalFields.includes('submitted_at') && <col style={{ width: `${getColumnWidth('submitted_at')}px` }} />}
                  <col style={{ width: `${getColumnWidth('details')}px` }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-slate-200 text-center text-xl font-semibold text-slate-500 uppercase tracking-wider">
                    <ResizableTableHeaderCell
                      column="submit_index"
                      label="#"
                      width={getColumnWidth('submit_index')}
                      onResize={(delta) => handleColumnResize('submit_index', delta)}
                    />
                    <ResizableTableHeaderCell
                      column="full_name"
                      label="Tên"
                      width={getColumnWidth('full_name')}
                      onResize={(delta) => handleColumnResize('full_name', delta)}
                      onSort={() => onHeaderSort('full_name')}
                      isSorted={tableSortBy === 'full_name'}
                      sortOrder={tableSortOrder}
                    />
                    <ResizableTableHeaderCell
                      column="class_name"
                      label="Lớp"
                      width={getColumnWidth('class_name')}
                      onResize={(delta) => handleColumnResize('class_name', delta)}
                      onSort={() => onHeaderSort('class_name')}
                      isSorted={tableSortBy === 'class_name'}
                      sortOrder={tableSortOrder}
                    />
                    <ResizableTableHeaderCell
                      column="department"
                      label="Ban"
                      width={getColumnWidth('department')}
                      onResize={(delta) => handleColumnResize('department', delta)}
                      onSort={() => onHeaderSort('department')}
                      isSorted={tableSortBy === 'department'}
                      sortOrder={tableSortOrder}
                    />
                    <ResizableTableHeaderCell
                      column="status"
                      label="Trạng thái"
                      width={getColumnWidth('status')}
                      onResize={(delta) => handleColumnResize('status', delta)}
                      onSort={() => onHeaderSort('status')}
                      isSorted={tableSortBy === 'status'}
                      sortOrder={tableSortOrder}
                    />
                    {selectedAdditionalFields.includes('student_id') && (
                      <ResizableTableHeaderCell
                        column="student_id"
                        label="MSSV"
                        width={getColumnWidth('student_id')}
                        onResize={(delta) => handleColumnResize('student_id', delta)}
                      />
                    )}
                    {selectedAdditionalFields.includes('email') && (
                      <ResizableTableHeaderCell
                        column="email"
                        label="Email"
                        width={getColumnWidth('email')}
                        onResize={(delta) => handleColumnResize('email', delta)}
                      />
                    )}
                    {selectedAdditionalFields.includes('birth_date') && (
                      <ResizableTableHeaderCell
                        column="birth_date"
                        label="Ngày sinh"
                        width={getColumnWidth('birth_date')}
                        onResize={(delta) => handleColumnResize('birth_date', delta)}
                      />
                    )}
                    {selectedAdditionalFields.includes('gender') && (
                      <ResizableTableHeaderCell
                        column="gender"
                        label="Giới tính"
                        width={getColumnWidth('gender')}
                        onResize={(delta) => handleColumnResize('gender', delta)}
                      />
                    )}
                    {selectedAdditionalFields.includes('submitted_at') && (
                      <ResizableTableHeaderCell
                        column="submitted_at"
                        label="Thời gian nộp"
                        width={getColumnWidth('submitted_at')}
                        onResize={(delta) => handleColumnResize('submitted_at', delta)}
                      />
                    )}
                    <ResizableTableHeaderCell
                      column="details"
                      label=""
                      width={getColumnWidth('details')}
                      onResize={(delta) => handleColumnResize('details', delta)}
                      className="sticky right-0 z-20 border-l border-blue-500/30 shadow-[-10px_0_14px_-12px_rgba(15,23,42,0.5)]"
                    />
                  </tr>
                </thead>
                <tbody>
                  {excelRows.length > 0 ? excelRows.map((row, idx) => {
                    const effectiveStatus = getEffectiveStatus(row);
                    const cfg = CANDIDATE_STATUS[effectiveStatus];
                    return (
                      <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-center">
                        <td style={{ width: `${getColumnWidth('submit_index')}px`, minWidth: `${getColumnWidth('submit_index')}px`, maxWidth: `${getColumnWidth('submit_index')}px` }} className="border-b border-slate-100 px-2 py-3 text-center text-xs text-slate-500 whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td style={{ width: `${getColumnWidth('full_name')}px`, minWidth: `${getColumnWidth('full_name')}px`, maxWidth: `${getColumnWidth('full_name')}px` }} className="border-b border-slate-100 px-2 py-3 text-sm font-medium text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
                          {row.full_name || 'Unknown'}
                        </td>
                        <td style={{ width: `${getColumnWidth('class_name')}px`, minWidth: `${getColumnWidth('class_name')}px`, maxWidth: `${getColumnWidth('class_name')}px` }} className="border-b border-slate-100 px-2 py-3 text-center text-sm text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                          {row.class_name || 'N/A'}
                        </td>
                        <td style={{ width: `${getColumnWidth('department')}px`, minWidth: `${getColumnWidth('department')}px`, maxWidth: `${getColumnWidth('department')}px` }} className="border-b border-slate-100 px-2 py-3 text-center text-sm text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                          {row.department || 'Unknown'}
                        </td>
                        <td style={{ width: `${getColumnWidth('status')}px`, minWidth: `${getColumnWidth('status')}px`, maxWidth: `${getColumnWidth('status')}px` }} className="border-b border-slate-100 px-2 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.circleColor}`} />
                            <span className={`text-xs ${cfg.textColor}`}>{cfg.label}</span>
                          </div>
                        </td>
                        {selectedAdditionalFields.includes('student_id') && (
                          <td style={{ width: `${getColumnWidth('student_id')}px`, minWidth: `${getColumnWidth('student_id')}px`, maxWidth: `${getColumnWidth('student_id')}px` }} className="border-b border-slate-100 px-2 py-3 text-center text-sm text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.student_id || 'N/A'}
                          </td>
                        )}
                        {selectedAdditionalFields.includes('email') && (
                          <td style={{ width: `${getColumnWidth('email')}px`, minWidth: `${getColumnWidth('email')}px`, maxWidth: `${getColumnWidth('email')}px` }} className="border-b border-slate-100 px-2 py-3 text-xs text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.email || 'N/A'}
                          </td>
                        )}
                        {selectedAdditionalFields.includes('birth_date') && (
                          <td style={{ width: `${getColumnWidth('birth_date')}px`, minWidth: `${getColumnWidth('birth_date')}px`, maxWidth: `${getColumnWidth('birth_date')}px` }} className="border-b border-slate-100 px-2 py-3 text-center text-sm text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.birth_date || 'N/A'}
                          </td>
                        )}
                        {selectedAdditionalFields.includes('gender') && (
                          <td style={{ width: `${getColumnWidth('gender')}px`, minWidth: `${getColumnWidth('gender')}px`, maxWidth: `${getColumnWidth('gender')}px` }} className="border-b border-slate-100 px-2 py-3 text-center text-sm text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">
                            {row.gender || 'N/A'}
                          </td>
                        )}
                        {selectedAdditionalFields.includes('submitted_at') && (
                          <td style={{ width: `${getColumnWidth('submitted_at')}px`, minWidth: `${getColumnWidth('submitted_at')}px`, maxWidth: `${getColumnWidth('submitted_at')}px` }} className="border-b border-slate-100 px-2 py-3 text-center text-xs text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatDateTime(row.submitted_at)}
                          </td>
                        )}
                        <td style={{ width: `${getColumnWidth('details')}px`, minWidth: `${getColumnWidth('details')}px`, maxWidth: `${getColumnWidth('details')}px` }} className="sticky right-0 z-10 border-b border-l border-slate-100 bg-white px-2 py-3 text-center shadow-[-10px_0_14px_-12px_rgba(15,23,42,0.35)]">
                          <Button size="sm" variant="outline" onClick={() => openDetail(row)}>Chi tiết</Button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6 + selectedAdditionalFields.length} className="text-center text-slate-500 py-8">
                        Không có dữ liệu phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── Candidate Data Statistics ─────────────────────────────── */}
        <Card className="mt-6">
          <div id="candidate-stats-section" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thống kê dữ liệu ứng viên</CardTitle>
            <CardDescription className="text-xs">Phân tích đơn đăng ký theo ban, giới tính và lớp</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bar: registrations by department */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 text-center">Số đăng ký theo ban</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={departmentStats} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="department" tick={false} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RechartsTooltip formatter={(value) => [value, 'Số lượng']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {departmentStats.map((_, i) => (
                        <Cell key={`dept-${i}`} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {departmentStats.map((entry, i) => (
                    <div key={entry.department} className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                      <span className="text-xs text-slate-600">{entry.department}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie: gender */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 text-center">Giới tính ứng viên</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={genderStats}
                      cx="50%"
                      cy="45%"
                      outerRadius={72}
                      dataKey="value"
                      nameKey="name"
                    >
                      {genderStats.map((_, i) => (
                        <Cell key={`gender-${i}`} fill={GENDER_PIE_COLORS[i % GENDER_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar: class distribution */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 text-center">Số đăng ký theo lớp</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={classStats.slice(0, 6)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="className" tick={false} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <RechartsTooltip formatter={(value) => [value, 'Số lượng']} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {classStats.slice(0, 6).map((_, i) => (
                        <Cell key={`class-${i}`} fill={BAR_PALETTE[i % BAR_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {classStats.slice(0, 6).map((entry, i) => (
                    <div key={entry.className} className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: BAR_PALETTE[i % BAR_PALETTE.length] }} />
                      <span className="text-xs text-slate-600">{entry.className}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Application Results Statistics ───────────────────────── */}
        <Card className="mt-6">
          <div id="recruitment-results-section" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thống kê kết quả tuyển Cộng tác viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
              {/* 1/3 — Pie: applicant status */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 text-center">Trạng thái ứng viên</p>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusStats.filter(s => s.value > 0)}
                      cx="50%"
                      cy="42%"
                      outerRadius={78}
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusStats.filter(s => s.value > 0).map((entry) => (
                        <Cell key={`status-${entry.key}`} fill={STATUS_PIE_COLORS[entry.key as CandidateStatus]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 2/3 — Bar: accepted per department */}
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 text-center">Số lượng CTV trúng tuyển theo ban</p>
                {acceptedByDepartment.length === 0 ? (
                  <div className="flex h-[260px] items-center justify-center text-sm text-slate-400 italic">
                    Chưa có dữ liệu
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={acceptedByDepartment} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="department" tick={false} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <RechartsTooltip formatter={(value) => [value, 'Đồng ý']} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {acceptedByDepartment.map((_, i) => (
                            <Cell key={`acc-${i}`} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                      {acceptedByDepartment.map((entry, i) => (
                        <div key={entry.department} className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                          <span className="text-xs text-slate-600">{entry.department}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Accepted Candidates by Department ────────────────────── */}
        <Card className="mt-6 mb-2">
          <div id="accepted-candidates-section" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh sách Tân cộng tác viên</CardTitle>
          </CardHeader>
          <CardContent>
            {acceptedCandidatesByDept.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">Chưa có dữ liệu.</p>
            ) : (
              <div className="space-y-6">
                {acceptedCandidatesByDept.map(({ dept, candidates }) => (
                  <div key={dept}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                      <h3 className="font-semibold text-sm text-blue-500">Ban {dept}</h3>
                      <Badge className="bg-green-100 text-green-700 border border-green-200 hover:bg-green-100 text-xs">
                        {candidates.length} bạn
                      </Badge>
                    </div>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ tên</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">MSSV</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lớp</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidates.map((c, i) => (
                            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="px-3 py-2 text-slate-500 text-xs">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-800">{c.full_name || 'N/A'}</td>
                              <td className="px-3 py-2 text-slate-600">{c.student_id || 'N/A'}</td>
                              <td className="px-3 py-2 text-slate-600">{c.class_name || 'N/A'}</td>
                              <td className="px-3 py-2 text-slate-600">{c.email || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>
      )}

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
                  <div className="sm:col-span-2"><span className="text-slate-500">Thời gian nộp:</span> <span className="font-medium">{formatDateTime(detailSubmission.submitted_at)}</span></div>
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
                        <CardTitle className="text-sm">Câu hỏi cá nhân:</CardTitle>
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
                        <CardTitle className="text-sm">Câu hỏi của ban {detailSubmission.department}:</CardTitle>
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
  const [pageStatuses, setPageStatuses] = useState<Record<string, ServiceStatus>>({
    home: 'idle', achievements: 'idle', activities: 'idle', apply: 'idle',
    blog: 'idle', structure: 'idle', a80: 'idle', aiPage: 'idle',
  });
  const [pageMessages, setPageMessages] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<Array<{ id: string; label: string; ok: boolean; msg: string; at: string }>>([]);

  const appendLog = (label: string, ok: boolean, msg: string) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label,
      ok,
      msg,
      at: new Date().toISOString(),
    };
    setLogs((prev) => [entry, ...prev].slice(0, 50));
  };

  const runTest = async (
    key: string,
    label: string,
    fn: () => Promise<{ ok: boolean; msg: string }>,
  ) => {
    setStatuses(s => ({ ...s, [key]: 'loading' }));
    try {
      const result = await fn();
      setStatuses(s => ({ ...s, [key]: result.ok ? 'ok' : 'error' }));
      setMessages(m => ({ ...m, [key]: result.msg }));
      appendLog(label, result.ok, result.msg);
    } catch (e) {
      setStatuses(s => ({ ...s, [key]: 'error' }));
      const msg = String(e);
      setMessages(m => ({ ...m, [key]: msg }));
      appendLog(label, false, msg);
    }
  };

  const runPageTest = async (
    key: string,
    label: string,
    fn: () => Promise<{ ok: boolean; msg: string }>,
  ) => {
    setPageStatuses(s => ({ ...s, [key]: 'loading' }));
    try {
      const result = await fn();
      setPageStatuses(s => ({ ...s, [key]: result.ok ? 'ok' : 'error' }));
      setPageMessages(m => ({ ...m, [key]: result.msg }));
      appendLog(label, result.ok, result.msg);
    } catch (e) {
      setPageStatuses(s => ({ ...s, [key]: 'error' }));
      const msg = String(e);
      setPageMessages(m => ({ ...m, [key]: msg }));
      appendLog(label, false, msg);
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

  const pageChecks: {
    key: string;
    label: string;
    desc: string;
    path: string;
  }[] = [
    { key: 'home', label: 'Trang chủ', desc: 'Danh mục trang: Trang chủ', path: '/' },
    { key: 'achievements', label: 'Thành tích', desc: 'Danh mục trang: Thành tích', path: '/achievements' },
    { key: 'activities', label: 'Hoạt động', desc: 'Danh mục trang: Hoạt động', path: '/activities' },
    { key: 'apply', label: 'Đơn đăng ký', desc: 'Danh mục trang: Đơn đăng ký', path: '/apply' },
    { key: 'blog', label: 'Blog', desc: 'Trang khác: Blog', path: '/blog' },
    { key: 'structure', label: 'Cơ cấu', desc: 'Trang khác: Cơ cấu', path: '/structure' },
    { key: 'a80', label: 'A80', desc: 'Trang khác: A80', path: '/a80' },
    { key: 'aiPage', label: 'AI', desc: 'Trang khác: AI', path: '/ai' },
  ];

  const testAll = () => {
    services.forEach((svc) => runTest(svc.key, svc.label, svc.onTest));
    pageChecks.forEach((page) =>
      runPageTest(page.key, page.label, async () => {
        const res = await fetch(page.path, { cache: 'no-store' });
        return {
          ok: res.ok,
          msg: res.ok ? `Kết nối trang ${page.path} thành công` : await getErrorMessage(res),
        };
      })
    );
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kiểm thử kết nối</h1>
          <p className="text-sm text-slate-500 mt-1">Kiểm tra trạng thái các dịch vụ backend</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setLogs([])} variant="outline" size="sm" disabled={logs.length === 0}>
            Xóa log
          </Button>
          <Button onClick={testAll} variant="outline" size="sm">
            <Wrench className="w-4 h-4 mr-2" />
            Test tất cả
          </Button>
        </div>
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
                    onClick={() => runTest(key, label, onTest)}
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

      <div className="mt-6">
        <h2 className="text-base font-semibold text-slate-700 mb-3">Kiểm tra kết nối theo trang</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {pageChecks.map((page) => (
            <Card key={page.key}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100">
                    <ExternalLink className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-medium text-slate-800">{page.label}</p>
                      <StatusBadge status={pageStatuses[page.key] as ServiceStatus} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{page.desc}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{page.path}</p>
                    {pageMessages[page.key] && (
                      <p className={`text-xs mt-2 ${pageStatuses[page.key] === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                        {pageMessages[page.key]}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      disabled={pageStatuses[page.key] === 'loading'}
                      onClick={() =>
                        runPageTest(page.key, page.label, async () => {
                          const res = await fetch(page.path, { cache: 'no-store' });
                          return {
                            ok: res.ok,
                            msg: res.ok ? `Kết nối trang ${page.path} thành công` : await getErrorMessage(res),
                          };
                        })
                      }
                    >
                      {pageStatuses[page.key] === 'loading'
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Log kiểm thử kết nối</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có log. Hãy chạy kiểm tra để xem kết quả theo từng trang và dịch vụ.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.map((item) => (
                <div key={item.id} className="rounded-lg border px-3 py-2 text-sm bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <span className={item.ok ? 'text-green-600 text-xs font-semibold' : 'text-red-600 text-xs font-semibold'}>
                      {item.ok ? 'SUCCESS' : 'ERROR'}
                    </span>
                  </div>
                  <p className={item.ok ? 'text-green-700 text-xs mt-1' : 'text-red-700 text-xs mt-1'}>{item.msg}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{formatDateTime(item.at)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
// Panel: Category — Structure
// ─────────────────────────────────────────────────────────────────────────────

function CategoryStructurePanel({ adminPassword }: { adminPassword: string }) {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Cơ cấu" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Cơ cấu</h1>
        <p className="text-sm text-slate-500 mt-1">Thêm, sửa và quản lý các ban trong cơ cấu tổ chức</p>
      </div>

      <StructureAdmin adminPassword={adminPassword} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category — Achievements
// ─────────────────────────────────────────────────────────────────────────────

function CategoryAchievementsPanel({ adminPassword }: { adminPassword: string }) {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Thành tích" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Thành tích</h1>
        <p className="text-sm text-slate-500 mt-1">Thêm, sửa và quản lý các thành tích của đoàn</p>
      </div>

      <AchievementsAdmin adminPassword={adminPassword} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category — Activities
// ─────────────────────────────────────────────────────────────────────────────

function CategoryActivitiesPanel({ adminPassword }: { adminPassword: string }) {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Hoạt động" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Hoạt động</h1>
        <p className="text-sm text-slate-500 mt-1">Thêm, sửa và phân loại nội dung vào Chuyên mục hoặc Chương trình</p>
      </div>

      <ActivitiesAdmin adminPassword={adminPassword} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category Partners
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPartnersPanel({ adminPassword }: { adminPassword: string }) {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Đơn vị hợp tác" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Đơn vị hợp tác</h1>
        <p className="text-sm text-slate-500 mt-1">Thêm, sửa và quản lý các đơn vị hợp tác</p>
      </div>

      <PartnersAdmin adminPassword={adminPassword} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category Blog Testimonials
// ─────────────────────────────────────────────────────────────────────────────

function CategoryBlogTestimonialsPanel({ adminPassword }: { adminPassword: string }) {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Lời gửi gắm" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Lời gửi gắm cựu thành viên</h1>
        <p className="text-sm text-slate-500 mt-1">Thêm, sửa và công khai lời gửi gắm từ cựu thành viên trên trang Diễn đàn</p>
      </div>

      <BlogTestimonialsAdmin adminPassword={adminPassword} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Category Blog Discussions
// ─────────────────────────────────────────────────────────────────────────────

function CategoryBlogDiscussionsPanel({ adminPassword }: { adminPassword: string }) {
  return (
    <div>
      <div className="mb-6">
        <Breadcrumb label="Diễn đàn" />
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Diễn đàn thảo luận</h1>
        <p className="text-sm text-slate-500 mt-1">Xem bình luận người dùng, phản hồi với vai trò Admin và ẩn/hiện bình luận</p>
      </div>

      <BlogDiscussionAdmin adminPassword={adminPassword} />
    </div>
  );
}
