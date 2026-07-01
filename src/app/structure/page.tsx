"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PageBanner } from '@/components/shared/PageBanner';
import { Footer } from '@/components/layout/Footer';
import type { StructureDepartmentRow } from '@/lib/structureDepartments';

export default function StructurePage() {
  const [departments, setDepartments] = useState<StructureDepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/structure', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch structure departments');
        const json = await res.json();
        setDepartments(Array.isArray(json?.data) ? json.data : []);
      } catch (err) {
        setError(String(err));
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const activeDept = departments[activeIndex];

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <div>
        <PageBanner
          title="CƠ CẤU TỔ CHỨC"
          subtitle='"Một ban làm chẳng nên non, bốn ban chụm lại nên hòn núi cao"'
          imageUrl="/images/back-ocean.jpg"
          imageHint="teamwork architecture"
        />

        <main className="container mx-auto px-4 py-12 md:py-24 max-w-6xl">
          {loading && (
            <div className="py-12 text-center text-muted-foreground animate-pulse font-nunito italic">
              Đang tải không gian trải nghiệm 4 Ban...
            </div>
          )}

          {error && (
            <div className="py-12 text-center text-destructive font-medium">Lỗi: {error}</div>
          )}

          {!loading && !error && departments.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Chưa có ban nào để hiển thị.</div>
          )}

          {!loading && !error && departments.length > 0 && (
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* CỘT TRÁI - MENU CHỌN BAN (Đã ẩn thanh cuộn thô trên PC) */}
              <div className="w-full md:col-span-4 flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 md:sticky md:top-24 z-10 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="hidden md:block text-xs font-bold text-primary/60 uppercase tracking-widest pl-2 mb-1">
                  Khám phá các Ban
                </div>
                
                {departments.map((dept, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => setActiveIndex(index)}
                      className={`flex-shrink-0 w-[75vw] sm:w-[45vw] md:w-full text-left p-4 md:p-5 rounded-xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden snap-center ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 md:scale-[1.01]'
                          : 'bg-card text-card-foreground border-border/60 hover:bg-muted/50 hover:border-border'
                      }`}
                    >
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      )}

                      <div className="relative z-10 pr-2">
                        <h4 className={`font-anton text-base lg:text-lg font-normal tracking-wide uppercase transition-colors ${isActive ? 'text-white' : 'text-foreground'}`}>
                          {dept.name}
                        </h4>
                        
                        {dept.short_description && (
                          <p className={`text-xs mt-0.5 line-clamp-1 ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {dept.short_description}
                          </p>
                        )}
                      </div>

                      <span className={`hidden md:inline transform transition-transform duration-300 z-10 ${isActive ? 'translate-x-1 font-bold' : 'group-hover:translate-x-1 text-muted-foreground'}`}>
                        →
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CỘT PHẢI - NỘI DUNG CHI TIẾT */}
              <div className="w-full md:col-span-8 bg-card border border-border/50 rounded-2xl p-5 md:p-8 shadow-sm min-h-[500px]">
                {activeDept ? (
                  <div key={activeDept.id} className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* HÌNH ẢNH BAN */}
                    <div className="relative h-56 sm:h-80 md:h-[400px] w-full overflow-hidden rounded-xl bg-muted shadow-inner group">
                      {activeDept.images.length > 0 ? (
                        <Image
                          src={activeDept.images[0]}
                          alt={activeDept.name}
                          fill
                          priority
                          sizes="(max-width: 768px) 100vw, 66vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">
                          Hình ảnh đang được cập nhật
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      
                      <span className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-sm">
                        {activeDept.name}
                      </span>
                    </div>

                    {/* MÔ TẢ NGẮN / SLOGAN */}
                    {activeDept.short_description && activeDept.short_description.trim() !== "" && (
                      <div className="border-l-4 border-amber-500 pl-4 py-1">
                        <p className="text-sm md:text-base font-semibold text-amber-600 dark:text-amber-400 font-nunito italic">
                          "{activeDept.short_description}"
                        </p>
                      </div>
                    )}

                    {/* NỘI DUNG CHI TIẾT */}
                    {activeDept.content && (
                      <div className="text-muted-foreground text-sm md:text-base space-y-4 text-justify leading-relaxed font-normal">
                        {activeDept.content.split('\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    )}

                    {/* GALLERY HÌNH PHỤ (Đã phục hồi lại thanh cuộn ngang chuẩn chỉ `scrollbar-thin`) */}
                    {activeDept.images.length > 1 && (
                      <div className="pt-4 border-t border-border/40">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                          Một vài hình ảnh của {activeDept.name}:
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x">
                          {activeDept.images.slice(1).map((imageUrl, imgIndex) => (
                            <div 
                              key={imgIndex} 
                              className="relative w-28 h-20 sm:w-36 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer snap-center"
                            >
                              <Image
                                src={imageUrl}
                                alt={`${activeDept.name} gallery ${imgIndex + 1}`}
                                fill
                                sizes="(max-width: 768px) 120px, 150px"
                                className="object-cover hover:opacity-90 transition-opacity"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12 font-nunito">
                    Không tìm thấy dữ liệu Ban.
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}