"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Trash2, Download, RefreshCw, Eye, EyeOff, TestTube, RotateCcw, ArrowRight } from 'lucide-react';
import { ApplicationFormsAdmin } from '@/components/admin/ApplicationFormsAdmin';

interface AdminSettings {
  youtubeVideoId: string;
  homepageTitle: string;
  homepageDescription: string;
  contactFormTitle: string;
  contactFormSubtitle: string;
  googleSheetId: string;
  googleSheetRange: string;
  googleSheetRangeContact: string;
  googleSheetRangeComments: string;
  lastUpdated?: string;
}

interface VisitMetrics {
  visits: number;
  lastUpdated: string;
}

interface SiteConfig {
  title: string;
  frontendUrl: string;
  adminPageUrl: string;
  showAdminLink: boolean;
  adminLinkLabel: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [metrics, setMetrics] = useState<VisitMetrics | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [activeTab, setActiveTab] = useState<"forms" | "settings" | "submissions">("forms");

  const ADMIN_PASSWORD = 'maiyeuquangan'; // Change this to a secure password

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Mật khẩu sai, vui lòng nhập lại!');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadData() {
      const [settingsRes, metricsRes, subsRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/visits'),
        fetch(`/api/admin/application-form-submissions?page=${currentPage}&pageSize=50`),
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (subsRes.ok) {
        const data = await subsRes.json();
        setSubmissions(data?.data || []);
        setTotalSubmissions(data?.total || 0);
        setTotalPages(data?.totalPages || 1);
      }
    }

    loadData();
  }, [isAuthenticated, currentPage]);

  useEffect(() => {
    async function loadSiteConfig() {
      try {
        const res = await fetch('/api/site-config');
        if (res.ok) {
          const data = await res.json();
          setSiteConfig(data);
        }
      } catch (error) {
        console.warn('Could not fetch site configuration from Sanity:', error);
      }
    }

    loadSiteConfig();
  }, []);

  const updateSettings = (field: string, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      const fresh = await res.json();
      setSettings(fresh);
      alert('Lưu cài đặt thành công');
    } else {
      alert('Lỗi khi lưu cài đặt');
    }

    setSaving(false);
  };

  const testGoogleSheets = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/form-submissions');
      if (res.ok) {
        setTestResult('Kết nối Google Sheets thành công!');
      } else {
        setTestResult('Lỗi kết nối Google Sheets: ' + res.statusText);
      }
    } catch (error) {
      setTestResult('Lỗi: ' + String(error));
    }

    setTesting(false);
  };

  const exportSettings = () => {
    if (!settings) return;
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'admin-settings.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const resetToDefaults = async () => {
    if (!confirm('Bạn có chắc muốn reset về mặc định?')) return;

    const defaults: Partial<AdminSettings> = {
      youtubeVideoId: 'dQw4w9WgXcQ',
      homepageTitle: 'Đoàn Khoa Tài chính - Ngân hàng',
      homepageDescription: 'Cùng nhau xây dựng hành trình thanh xuân rực rỡ',
      contactFormTitle: 'Liên hệ với chúng tôi',
      contactFormSubtitle: 'Xin vui lòng cung cấp thông tin của bạn',
      googleSheetId: process.env.GOOGLE_SHEET_ID || 'your_google_sheet_id_here',
      googleSheetRange: 'Sheet1!A:Z',
      googleSheetRangeContact: 'Contact!A:D',
      googleSheetRangeComments: 'Comments!A:F',
    };

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaults),
    });

    if (res.ok) {
      const fresh = await res.json();
      setSettings(fresh);
      alert('Đã reset về mặc định');
    } else {
      alert('Lỗi khi reset');
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Xóa submission này?')) return;

    // Note: This would require a delete API, but for now, just remove from local state
    setSubmissions(prev => prev.filter(s => s.id !== id));
    alert('Đã xóa (chỉ local, cần API để xóa thật)');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button onClick={handleLogin} className="mt-4 w-full">Đăng nhập</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="w-64 bg-white border-r p-4">
          <h2 className="text-lg font-bold mb-4">Quản trị</h2>
          <div className="space-y-2">
            <Button
              type="button"
              variant={activeTab === "forms" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setActiveTab("forms")}
            >
              Forms
            </Button>
            <Button
              type="button"
              variant={activeTab === "settings" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </Button>
            <Button
              type="button"
              variant={activeTab === "submissions" ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setActiveTab("submissions")}
            >
              Submissions
            </Button>
          </div>
        </aside>

        <div className="flex-1 container mx-auto p-6">
          {activeTab === "forms" ? (
            <ApplicationFormsAdmin adminPassword={password} />
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Bảng Quản trị</h1>
                <div className="flex gap-2">
                  {siteConfig?.showAdminLink && (
                    <Link href={siteConfig.frontendUrl} target="_blank" className="inline-flex">
                      <Button variant="secondary" className="flex items-center gap-1">
                        {siteConfig.adminLinkLabel || "Open Website"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                  <Button onClick={exportSettings} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Settings
                  </Button>
                  <Button onClick={resetToDefaults} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Defaults
                  </Button>
                </div>
              </div>
              <p className="mb-6 text-sm text-muted-foreground">Quản lý nội dung homepage và Google Sheets</p>

              <div className="grid gap-6 lg:grid-cols-3 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Thống kê truy cập</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Visit count: <strong>{metrics?.visits ?? 0}</strong>
                    </p>
                    <p>
                      Updated: <strong>{metrics?.lastUpdated ?? "N/A"}</strong>
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Form submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Tổng: <strong>{totalSubmissions}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Hiển thị trang {currentPage}/{totalPages}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sheet hiện tại</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      ID: <strong>{settings?.googleSheetId || "Chưa cấu hình"}</strong>
                    </p>
                    <p>
                      Dòng: <strong>{settings?.googleSheetRange || "Sheet1!A:Z"}</strong>
                    </p>
                    <Button onClick={testGoogleSheets} disabled={testing} size="sm" className="mt-2">
                      <TestTube className="w-4 h-4 mr-2" />
                      {testing ? "Đang test..." : "Test Connection"}
                    </Button>
                    {testResult && (
                      <Alert className="mt-2">
                        <div className="text-sm">{testResult}</div>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Cài đặt Homepage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings ? (
                    <>
                      <div className="grid gap-3">
                        <label className="font-semibold">YouTube ID / URL</label>
                        <Input
                          value={settings.youtubeVideoId}
                          onChange={(e) => updateSettings("youtubeVideoId", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-3">
                        <label className="font-semibold">Tiêu đề trang chủ</label>
                        <Input
                          value={settings.homepageTitle}
                          onChange={(e) => updateSettings("homepageTitle", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <label className="font-semibold">Mô tả trang chủ</label>
                        <Input
                          value={settings.homepageDescription}
                          onChange={(e) => updateSettings("homepageDescription", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-3">
                        <label className="font-semibold">Tiêu đề form liên hệ</label>
                        <Input
                          value={settings.contactFormTitle}
                          onChange={(e) => updateSettings("contactFormTitle", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <label className="font-semibold">Tiêu đề phụ form liên hệ</label>
                        <Input
                          value={settings.contactFormSubtitle}
                          onChange={(e) => updateSettings("contactFormSubtitle", e.target.value)}
                        />
                      </div>

                      <h3 className="text-lg font-semibold mt-4">Cấu hình Google Sheets</h3>
                      <div className="grid gap-3">
                        <label className="font-semibold">GOOGLE_SHEET_ID</label>
                        <Input
                          value={settings.googleSheetId}
                          onChange={(e) => updateSettings("googleSheetId", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <label className="font-semibold">GOOGLE_SHEET_RANGE</label>
                        <Input
                          value={settings.googleSheetRange}
                          onChange={(e) => updateSettings("googleSheetRange", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <label className="font-semibold">GOOGLE_SHEET_RANGE_CONTACT</label>
                        <Input
                          value={settings.googleSheetRangeContact}
                          onChange={(e) => updateSettings("googleSheetRangeContact", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-3">
                        <label className="font-semibold">GOOGLE_SHEET_RANGE_COMMENTS</label>
                        <Input
                          value={settings.googleSheetRangeComments}
                          onChange={(e) => updateSettings("googleSheetRangeComments", e.target.value)}
                        />
                      </div>

                      <Button onClick={saveSettings} disabled={saving} className="mt-3">
                        {saving ? "Đang lưu..." : "Lưu cài đặt"}
                      </Button>
                    </>
                  ) : (
                    <p>Đang tải cài đặt...</p>
                  )}
                </CardContent>
              </Card>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Danh sách nộp form</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <p>Không có dữ liệu.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr>
                              {Object.keys(submissions[0]).slice(0, 8).map((col) => (
                                <th key={col} className="px-2 py-1 border">
                                  {col}
                                </th>
                              ))}
                              <th className="px-2 py-1 border">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map((row, idx) => (
                              <tr key={idx} className="border-t">
                                {Object.values(row).slice(0, 8).map((cell, i) => (
                                  <td key={i} className="px-2 py-1 border">
                                    {String(cell || "")}
                                  </td>
                                ))}
                                <td className="px-2 py-1 border">
                                  <Button
                                    onClick={() => deleteSubmission(row.id || idx)}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-muted-foreground">
                          Trang {currentPage} / {totalPages} ({totalSubmissions} tổng cộng)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            size="sm"
                            variant="outline"
                          >
                            Trước
                          </Button>
                          <Button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            size="sm"
                            variant="outline"
                          >
                            Sau
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
