"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function RangRoVietNamAdmin() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!supabase) return;
    setLoading(true);
    // Lưu ý: Đảm bảo cột status đã được thêm vào DB
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    setData(submissions || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, newStatus: 'approved' | 'pending' | 'rejected') => {
    if (!supabase) return;
    await supabase.from('submissions').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const deleteItem = async (id: string) => {
    if (!supabase || !confirm("Bạn chắc chắn muốn xóa vĩnh viễn lời chúc này?")) return;
    await supabase.from('submissions').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Quản lý lời chúc Rạng rỡ Việt Nam</h2>
        <Button onClick={fetchData} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" /> Tải lại</Button>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="animate-spin mx-auto w-8 h-8 text-blue-500" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-sm text-slate-500">
                <th className="p-3">Người gửi</th>
                <th className="p-3">Lời chúc</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id} className="border-b hover:bg-slate-50 text-sm">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 max-w-xs truncate">{item.content}</td>
                  <td className="p-3">
                    {item.status === 'approved' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Đã duyệt</Badge>}
                    {item.status === 'pending' || !item.status && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Chờ xem xét</Badge>}
                    {item.status === 'rejected' && <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Từ chối</Badge>}
                  </td>
                  <td className="p-3 flex justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'approved')} title="Duyệt"><CheckCircle2 className="w-4 h-4 text-green-600" /></Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'pending')} title="Chờ"><AlertCircle className="w-4 h-4 text-yellow-600" /></Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'rejected')} title="Từ chối"><XCircle className="w-4 h-4 text-red-600" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}