"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import type { AlumniTestimonialRow } from "@/lib/blog";

export function TestimonialsSection() {
  const [rows, setRows] = useState<AlumniTestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const res = await fetch("/api/blog/testimonials", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Không tải được lời gửi gắm.");
      setRows(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center">Đang tải lời gửi gắm...</p>;
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground text-center">Chưa có lời gửi gắm nào được công khai.</p>;
  }

  return (
    <div className="space-y-8">
      {rows.map((item) => (
        <Card key={item.id} className="overflow-hidden shadow-lg">
          <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={item.avatar_url || ""} alt={item.full_name} />
              <AvatarFallback>{item.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="relative text-center md:text-left">
              <Quote className="absolute -top-2 left-0 h-8 w-8 text-primary/20 transform -translate-x-4" />
              <p className="font-bold font-headline text-lg text-primary">{item.full_name}</p>
              <div className="mb-4 space-y-1">
                {item.positions.map((pos, index) => (
                  <p key={`${item.id}-${index}`} className="text-sm font-semibold text-muted-foreground">
                    {pos}
                  </p>
                ))}
              </div>
              <blockquote className="text-muted-foreground italic text-justify">{item.message}</blockquote>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
