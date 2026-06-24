"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, AlertCircle, User, Mail, School, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function RangRoVietNamAdmin() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Ép kiểu để TS không báo lỗi null
    if (!supabase) return;
    setLoading(true);
    
    const { data: submissions, error } = await (supabase as any)
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Lỗi fetch:", error);
    } else {
      setData(submissions || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, newStatus: 'approved' | 'pending' | 'rejected') => {
    if (!supabase) return;
    
    const { error } = await (supabase as any)
      .from('submissions')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error("Lỗi update:", error);
      alert("Không thể cập nhật: " + error.message);
    } else {
      fetchData(); // Load lại ngay sau khi update thành công
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Xóa vĩnh viễn lời chúc này?")) return;
    
    const { error } = await (supabase as any).from('submissions').delete().eq('id', id);
    if (error) {
      console.error("Lỗi xóa:", error);
    } else {
      fetchData();
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
              <th className="p-4">Người gửi</th>
              <th className="p-4">Lời chúc & Ảnh</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-blue-500" /></td>
              </tr>
            ) : data.map((item) => (
              <tr key={item.id} className="border-b hover:bg-slate-50">
                <td className="p-4 text-sm">
                  <div className="font-semibold flex items-center gap-1"><User className="w-3 h-3" /> {item.name}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1"><School className="w-3 h-3" /> {item.class_name || 'N/A'}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {item.email || 'N/A'}</div>
                </td>
                <td className="p-4 max-w-sm">
                  <p className="text-sm text-slate-700 mb-2">{item.content}</p>
                  {item.image_url && (
                    <a href={item.image_url} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 underline">
                      <ImageIcon className="w-3 h-3" /> Xem ảnh đính kèm
                    </a>
                  )}
                </td>
                <td className="p-4">
                  {(item.status === 'approved') && <Badge className="bg-green-100 text-green-700">Đã duyệt</Badge>}
                  {(!item.status || item.status === 'pending') && <Badge className="bg-yellow-100 text-yellow-700">Chờ duyệt</Badge>}
                  {(item.status === 'rejected') && <Badge className="bg-red-100 text-red-700">Từ chối</Badge>}
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => updateStatus(item.id, 'approved')}><CheckCircle2 className="w-5 h-5 text-green-600" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => updateStatus(item.id, 'pending')}><AlertCircle className="w-5 h-5 text-yellow-600" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => updateStatus(item.id, 'rejected')}><XCircle className="w-5 h-5 text-red-600" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteItem(item.id)}><Trash2 className="w-5 h-5" /></Button>
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