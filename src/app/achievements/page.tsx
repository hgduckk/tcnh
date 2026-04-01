"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/shared/PageBanner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { useEffect, useMemo, useState } from "react";
import { Footer } from '@/components/layout/Footer';
import type { AchievementRow } from '@/lib/achievements';

function FeaturedAchievement({ images }: { images: string[] }) {
  if (images.length === 0) return null;

  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="w-full max-w-5xl text-center mx-auto mt-0">
      <div className="relative mx-auto w-full max-w-[480px] h-[300px] md:max-w-[1040px] md:h-[650px] rounded-xl shadow-2xl">
        {images.map((img, i) => (
          <Image
            key={i}
            src={img}
            alt={`Achievement ${i + 1}`}
            width={600}
            height={400}
            className={`absolute top-0 left-0 object-cover w-full h-full transition-opacity duration-700 ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Nút Prev */}
        <button
          onClick={prevSlide}
          className="absolute top-1/2 left-2 -translate-y-1/2 
                    bg-black/30 text-white px-2 py-1 text-sm 
                    rounded-full opacity-60 hover:opacity-90 transition"
        >
          ◀
        </button>

        {/* Nút Next */}
        <button
          onClick={nextSlide}
          className="absolute top-1/2 right-2 -translate-y-1/2 
                    bg-black/30 text-white px-2 py-1 text-sm 
                    rounded-full opacity-60 hover:opacity-90 transition"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);

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

  const featuredImages = useMemo(() => {
    return achievements.slice(0, 6).map((x) => x.image_url);
  }, [achievements]);


  return (
    <div>
      <PageBanner
        title="THÀNH TÍCH CHÚNG TỚ ĐẠT ĐƯỢC"
        subtitle='"Góc flexing chỉ là vô tình..."'
        imageUrl="/images/back-ocean.jpg"
        imageHint="trophies awards"
        className="brightness-150"
      />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <FeaturedAchievement images={featuredImages} />
        <h2 className="text-4xl md:text-5xl font-anton font-medium text-primary mt-14 md:mt-20 text-center">THÀNH TÍCH TIÊU BIỂU</h2>
        <div className="mt-5 grid grid-cols-1 gap-8 place-items-center">
          {!loading && achievements.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có thành tích nào để hiển thị.</p>
          )}
          {achievements.map((achievement, index) => (
            <ScrollReveal key={index} delayMs={80 * index}>
              <Card className="w-full max-w-4xl overflow-hidden shadow-lg hover:shadow-3xl transition-all duration-300 group mt-10">
                <div className="flex flex-col md:flex-row">
                  <CardContent className="p-0 md:w-1/2 flex justify-center">
                    <div className="w-full max-w-[400px] h-[250px] md:h-[300px] overflow-hidden rounded-lg transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src={achievement.image_url}
                        alt={achievement.title}
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                        data-ai-hint="achievement"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 md:w-1/2 flex flex-col justify-center bg-background">
                    <h3 className="font-nunito text-lg font-semibold text-primary text-justify">{achievement.title}</h3>
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
