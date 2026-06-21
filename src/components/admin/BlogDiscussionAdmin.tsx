"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import type { BlogCommentRow } from "@/lib/blog";

type CommentNode = BlogCommentRow & { replies: CommentNode[] };

function buildTree(rows: BlogCommentRow[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const row of rows) {
    map.set(row.id, { ...row, replies: [] });
  }

  for (const row of rows) {
    const current = map.get(row.id);
    if (!current) continue;

    if (row.parent_id) {
      const parent = map.get(row.parent_id);
      if (parent) {
        parent.replies.push(current);
      }
      continue;
    }

    roots.push(current);
  }

  for (const root of roots) {
    root.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return roots;
}

export function BlogDiscussionAdmin({ adminPassword }: { adminPassword: string }) {
  const [rows, setRows] = useState<BlogCommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [activeReplyTarget, setActiveReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const authHeaders = useMemo(() => ({ "x-admin-password": adminPassword }), [adminPassword]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blog/comments", { headers: authHeaders });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không tải được bình luận.");
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const tree = useMemo(() => buildTree(rows), [rows]);

  const togglePublish = async (id: string, nextValue: boolean) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog/comments/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: nextValue }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không cập nhật được trạng thái.");
      await refresh();
    } catch (e) {
      setError(String(e));
    }
  };

  const submitReply = async (parentId: string) => {
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blog/comments", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, comment: replyText, name: "Admin" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không gửi được phản hồi.");

      setReplyText("");
      setActiveReplyTarget(null);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmittingReply(false);
    }
  };

  const CommentItem = ({ item, level = 0 }: { item: CommentNode; level?: number }) => (
    <div className={level > 0 ? "ml-6 mt-3 border-l pl-4" : ""}>
      <div className="rounded-lg border p-4 bg-white space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.author_role === "admin" ? "default" : "secondary"}>
            {item.author_role === "admin" ? "Admin" : item.is_anonymous ? "Ẩn danh" : item.name || "Người dùng"}
          </Badge>
          <Badge variant={item.is_published ? "outline" : "destructive"}>
            {item.is_published ? "Đang hiển thị" : "Đang ẩn"}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
        </div>

        <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.comment}</p>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => togglePublish(item.id, !item.is_published)}
          >
            {item.is_published ? "Ẩn bình luận" : "Hiện bình luận"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveReplyTarget(activeReplyTarget === item.id ? null : item.id)}
          >
            Trả lời với vai trò Admin
          </Button>
        </div>

        {activeReplyTarget === item.id && (
          <div className="rounded-md border bg-slate-50 p-3 space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder="Nhập phản hồi của Admin..."
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setActiveReplyTarget(null)}>
                Hủy
              </Button>
              <Button type="button" onClick={() => submitReply(item.id)} disabled={submittingReply}>
                {submittingReply ? "Đang gửi..." : "Gửi phản hồi"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {item.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {item.replies.map((reply) => (
            <CommentItem key={reply.id} item={reply} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Danh sách thảo luận</CardTitle>
          <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
            {loading ? "Đang tải..." : "Tải lại"}
          </Button>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bình luận nào.</p>
          ) : (
            <div className="space-y-4">
              {tree.map((item) => (
                <CommentItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
