"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, AlertCircle, User, Mail, School, CreditCard, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function RangRoVietNamAdmin() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy toàn bộ danh sách lời chúc (không lọc approved để admin thấy hết)
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rangrovietnam/submissions?include_total=true');
      if (response.ok) {
        const result = await response.json();
        setData(result.submissions || []);
      } else {
        console.error("Lỗi khi gọi API lấy danh sách");
      }
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cập nhật trạng thái - Đã sửa truyền tham số qua ?id=${id}
  const updateStatus = async (id: string, newStatus: 'approved' | 'pending' | 'rejected') => {
    console.log(`Đang yêu cầu cập nhật bài đăng ${id} sang: ${newStatus}`);
    try {
      const response = await fetch(`/api/rangrovietnam/submissions?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        console.log("Cập nhật trạng thái thành công!");
        fetchData(); // Reload UI ngay lập tức
      } else {
        const errData = await response.json();
        console.error("Lỗi cập nhật từ API:", errData.error);
        alert("Cập nhật thất bại: " + errData.error);
      }
    } catch (error) {
      console.error("Lỗi kết nối mạng khi cập nhật:", error);
    }
  };

  // Xóa lời chúc - Đã sửa truyền tham số qua ?id=${id}
  const deleteItem = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn lời chúc này?")) return;
    try {
      const response = await fetch(`/api/rangrovietnam/submissions?id=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        console.log("Xóa thành công!");
        fetchData(); // Reload danh sách
      } else {
        const errData = await response.json();
        alert("Xóa thất bại: " + errData.error);
      }
    } catch (error) {
      console.error("Lỗi kết nối mạng khi xóa:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Quản lý lời chúc Rạng rỡ Việt Nam</h2>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Tải lại
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <th className="p-4">Người gửi & Thông tin</th>
              <th className="p-4">Lời chúc & Ảnh</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center">
                  <Loader2 className="animate-spin mx-auto w-8 h-8 text-blue-500" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-slate-400">Không có lời chúc nào trong danh sách.</td>
              </tr>
            ) : data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm">
                  <div className="font-semibold flex items-center gap-1 text-slate-800"><User className="w-3 h-3" /> {item.name}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><CreditCard className="w-3 h-3" /> MSSV: {item.student_id || 'N/A'}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><School className="w-3 h-3" /> Lớp: {item.class_name || 'N/A'}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> Email: {item.email || 'N/A'}</div>
                </td>
                <td className="p-4 max-w-sm">
                  <p className="text-sm text-slate-700 mb-2 whitespace-pre-wrap">{item.content}</p>
                  {item.image_url && (
                    <a href={item.image_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 underline hover:text-blue-800">
                      <ImageIcon className="w-3 h-3" /> Xem ảnh đính kèm
                    </a>
                  )}
                </td>
                <td className="p-4">
                  {item.status === 'approved' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none">Đã duyệt</Badge>}
                  {item.status === 'rejected' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none shadow-none">Từ chối</Badge>}
                  {(!item.status || item.status === 'pending') && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none shadow-none">Chờ duyệt</Badge>}
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-1">
                    <Button size="icon" variant="ghost" className="hover:bg-green-50 rounded-full" onClick={() => updateStatus(item.id, 'approved')} title="Duyệt lời chúc"><CheckCircle2 className="w-5 h-5 text-green-600" /></Button>
                    <Button size="icon" variant="ghost" className="hover:bg-yellow-50 rounded-full" onClick={() => updateStatus(item.id, 'pending')} title="Trả về hàng chờ"><AlertCircle className="w-5 h-5 text-yellow-600" /></Button>
                    <Button size="icon" variant="ghost" className="hover:bg-red-50 rounded-full" onClick={() => updateStatus(item.id, 'rejected')} title="Từ chối hiển thị"><XCircle className="w-5 h-5 text-red-600" /></Button>
                    <Button size="icon" variant="ghost" className="text-slate-400 hover:text-red-600 rounded-full" onClick={() => deleteItem(item.id)} title="Xóa vĩnh viễn"><Trash2 className="w-5 h-5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}