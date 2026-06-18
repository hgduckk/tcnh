"use client";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thành tích',
};
import { PageBanner } from '@/components/shared/PageBanner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { useEffect, useState } from "react";
import { Footer } from '@/components/layout/Footer';
import type { AchievementRow } from '@/lib/achievements';

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);

  const getSafeImageUrl = (value: string | null | undefined) => {
    const v = String(value || "").trim();
    if (!v) return "";
    if (v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://")) return v;
    return "";
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/achievements', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch achievements');
        const json = await res.json();
        if (!mounted) return;
        setAchievements(Array.isArray(json?.data) ? json.data : []);
      } catch {
        if (!mounted) return;
        setAchievements([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <PageBanner
        title="THÀNH TÍCH CHÚNG TỚ ĐẠT ĐƯỢC"
        subtitle='"Góc flexing chỉ là vô tình..."'
        imageUrl="/images/back-ocean.jpg"
        imageHint="trophies awards"
        className="brightness-150"
      />

      <main className="mx-auto w-full max-w-[1700px] px-4 py-14 md:px-8 md:py-20 lg:px-12">
        <div className="mt-8 grid grid-cols-1 gap-8 md:mt-10">
          {!loading && achievements.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có thành tích nào để hiển thị.</p>
          )}
          {achievements.map((achievement, index) => (
            <ScrollReveal key={index} delayMs={80 * index} className="mx-auto w-full max-w-[1320px]">
              <Card className="group w-full overflow-hidden border-none shadow-lg transition-all duration-300 hover:shadow-2xl">
                <div className="flex flex-col md:flex-row md:items-stretch">
                  <CardContent className="p-0 md:w-[48%]">
                    <div className="relative w-full overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]" style={{ aspectRatio: "4 / 3" }}>
                      {getSafeImageUrl(achievement.image_url) ? (
                        <img
                          src={getSafeImageUrl(achievement.image_url)}
                          alt={achievement.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-medium text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-background p-6 md:w-[52%] md:p-10">
                    <h3 className="font-nunito text-lg font-semibold leading-relaxed text-primary md:text-xl">{achievement.title}</h3>
                  </CardFooter>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
