"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Search, 
  Users, 
  MessageSquare, 
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Flag
} from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { formatDateTime } from '@/lib/utils';

interface Submission {
  id: string;
  name: string;
  student_id?: string;
  class_name?: string;
  faculty?: string;
  email?: string;
  content: string;
  image_url?: string;
  is_anonymous: boolean;
  created_at: string;
}

export default function AdminA80Page() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnonymous, setShowAnonymous] = useState(true);
  const [showNamed, setShowNamed] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, showAnonymous, showNamed]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/a80/submissions');
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        console.error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = submissions.filter(submission => {
      const matchesSearch = 
        submission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (submission.email && submission.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (submission.student_id && submission.student_id.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = 
        (submission.is_anonymous && showAnonymous) || 
        (!submission.is_anonymous && showNamed);

      return matchesSearch && matchesType;
    });

    setFilteredSubmissions(filtered);
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;

    try {
      const response = await fetch(`/api/a80/submissions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        setSelectedSubmission(null);
      } else {
        alert('Có lỗi xảy ra khi xóa tin nhắn');
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Có lỗi xảy ra khi xóa tin nhắn');
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch('/api/a80/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `a80-submissions-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Có lỗi xảy ra khi xuất file Excel');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  const formatDate = formatDateTime;

  const getStats = () => {
    const total = submissions.length;
    const anonymous = submissions.filter(s => s.is_anonymous).length;
    const named = total - anonymous;
    const withImages = submissions.filter(s => s.image_url).length;
    
    return { total, anonymous, named, withImages };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Flag className="w-8 h-8 text-red-600" />
              Quản lý A80 - Lá cờ Việt Nam
            </h1>
            <p className="text-gray-600">Quản lý tin nhắn gửi đến Hà Nội</p>
          </div>
          <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng tin nhắn</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Có tên</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.named}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <EyeOff className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ẩn danh</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.anonymous}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Có hình ảnh</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.withImages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm theo tên, nội dung, email, MSSV..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={showNamed ? "default" : "outline"}
                  onClick={() => setShowNamed(!showNamed)}
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Có tên ({stats.named})
                </Button>
                <Button
                  variant={showAnonymous ? "default" : "outline"}
                  onClick={() => setShowAnonymous(!showAnonymous)}
                  size="sm"
                >
                  <EyeOff className="w-4 h-4 mr-1" />
                  Ẩn danh ({stats.anonymous})
                </Button>
                <Button onClick={fetchSubmissions} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Làm mới
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách tin nhắn ({filteredSubmissions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {filteredSubmissions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    Không tìm thấy tin nhắn nào
                  </div>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedSubmission?.id === submission.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {submission.name}
                            </span>
                            {submission.is_anonymous && (
                              <Badge variant="secondary" className="text-xs">
                                Ẩn danh
                              </Badge>
                            )}
                            {submission.image_url && (
                              <Badge variant="outline" className="text-xs">
                                Có ảnh
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {submission.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(submission.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detail View */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết tin nhắn</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSubmission ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{selectedSubmission.name}</h3>
                    <div className="flex gap-2">
                      {selectedSubmission.is_anonymous && (
                        <Badge variant="secondary">Ẩn danh</Badge>
                      )}
                      <Button
                        onClick={() => deleteSubmission(selectedSubmission.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!selectedSubmission.is_anonymous && (
                      <>
                        {selectedSubmission.student_id && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">MSSV:</label>
                            <p className="text-gray-900">{selectedSubmission.student_id}</p>
                          </div>
                        )}
                        {selectedSubmission.class_name && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Lớp:</label>
                            <p className="text-gray-900">{selectedSubmission.class_name}</p>
                          </div>
                        )}
                        {selectedSubmission.faculty && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Khoa:</label>
                            <p className="text-gray-900">{selectedSubmission.faculty}</p>
                          </div>
                        )}
                        {selectedSubmission.email && (
                          <div>
                            <label className="text-sm font-medium text-gray-600">Email:</label>
                            <p className="text-gray-900">{selectedSubmission.email}</p>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nội dung:</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">
                        {selectedSubmission.content}
                      </p>
                    </div>

                    {selectedSubmission.image_url && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hình ảnh:</label>
                        <img
                          src={selectedSubmission.image_url}
                          alt="Submission image"
                          className="mt-2 max-w-full h-auto rounded-lg border"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">Thời gian:</label>
                      <p className="text-gray-900">{formatDate(selectedSubmission.created_at)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Chọn một tin nhắn để xem chi tiết
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}