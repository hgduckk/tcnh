"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Reply, Clock, User, UserX, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { BlogCommentRow } from "@/lib/blog";

type CommentNode = BlogCommentRow & { replies: CommentNode[] };

export function CommentSystem() {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      const res = await fetch("/api/blog/comments", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không tải được bình luận.");
      setComments(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const formatDate = formatDateTime;

  const CommentForm = ({ parentId, onCancel }: { parentId?: string; onCancel?: () => void }) => {
    const [name, setName] = useState("");
    const [comment, setComment] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!comment.trim()) {
        alert("Vui lòng nhập nội dung bình luận!");
        return;
      }

      if (!isAnonymous && !name.trim()) {
        alert("Vui lòng nhập tên hoặc chọn ẩn danh!");
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch("/api/blog/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            comment,
            parentId: parentId || null,
            isAnonymous,
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(json?.message || "Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại!");
          return;
        }

        setName("");
        setComment("");
        setIsAnonymous(false);
        if (onCancel) onCancel();
        fetchComments();
      } catch (error) {
        console.error("Error submitting comment:", error);
        alert("Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại!");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            id={`isAnonymous-${parentId || "main"}`}
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded"
          />
          <label htmlFor={`isAnonymous-${parentId || "main"}`} className="text-sm text-gray-600">
            Bình luận ẩn danh
          </label>
        </div>

        {!isAnonymous && (
          <Input
            placeholder="Tên của bạn *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={!isAnonymous}
            className="w-full"
          />
        )}

        <Textarea
          placeholder={parentId ? "Viết phản hồi..." : "Thắc mắc của bạn nè..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          className="w-full"
          rows={parentId ? 3 : 4}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="text-white">
            {isSubmitting ? "Đang gửi..." : parentId ? "Phản hồi" : "Gửi bình luận"}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          )}
        </div>
      </form>
    );
  };

  const CommentItem = ({ comment, level = 0 }: { comment: CommentNode; level?: number }) => (
    <div className={`${level > 0 ? "ml-8 mt-4 border-l-2 border-gray-200 pl-4" : "mb-6"}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="text-white">
                {comment.author_role === "admin" ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : comment.is_anonymous ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {comment.author_role === "admin"
                    ? "Admin"
                    : comment.is_anonymous
                    ? "Ẩn danh"
                    : comment.name}
                </span>
                {comment.author_role === "admin" && (
                  <Badge className="text-xs bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-100">
                    Quản trị viên
                  </Badge>
                )}
                {comment.author_role !== "admin" && comment.is_anonymous && (
                  <Badge variant="secondary" className="text-xs">
                    Ẩn danh
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(comment.created_at)}
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-700 mb-3 whitespace-pre-wrap">{comment.comment}</p>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-[#45973c] hover:bg-green-50"
          >
            <Reply className="w-4 h-4 mr-1" />
            Phản hồi
          </Button>
          {comment.replies.length > 0 && (
            <span className="text-xs text-gray-500">{comment.replies.length} phản hồi</span>
          )}
        </div>

        {replyingTo === comment.id && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <CommentForm parentId={comment.id} onCancel={() => setReplyingTo(null)} />
          </div>
        )}
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Card className="mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-anton text-primary font-medium">
          <MessageCircle className="w-6 h-6" />
          Diễn đàn thảo luận
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Bạn có thắc mắc gì hãy bình luận ở đây nha</h3>
          <CommentForm />
        </div>

        <div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#45973c]"></div>
                <span>Đang tải bình luận...</span>
              </div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Chưa có bình luận nào</p>
              <p className="text-sm">Hãy là người đầu tiên bình luận!</p>
            </div>
          ) : (
            <div className="space-y-6 text-justify">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
