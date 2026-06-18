"use client";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cơ cấu tổ chức',
};
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PageBanner } from '@/components/shared/PageBanner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import type { StructureDepartmentRow } from '@/lib/structureDepartments';

export default function StructurePage() {
  const [departments, setDepartments] = useState<StructureDepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <PageBanner
        title="CƠ CẤU TỔ CHỨC"
        subtitle='"Một ban làm chẳng nên non, bốn ban chụm lại nên hòn núi cao"'
        imageUrl="/images/back-ocean.jpg"
        imageHint="teamwork architecture"
      />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          {loading && (
            <div className="py-12 text-center text-muted-foreground">Đang tải cơ cấu tổ chức...</div>
          )}

          {error && (
            <div className="py-12 text-center text-red-600">Lỗi: {error}</div>
          )}

          {!loading && !error && departments.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Chưa có ban nào để hiển thị.</div>
          )}

          {!loading && !error && departments.length > 0 && (
            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {departments.map((dept, index) => (
                <ScrollReveal key={dept.id} delayMs={60 * index}>
                  <AccordionItem value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex flex-col">
                        <h3 className="font-anton text-2xl md:text-3xl font-normal text-primary">{dept.name}</h3>
                        <p className="text-lg text-muted-foreground mt-2 font-nunito italic">{dept.short_description}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1">
                      {dept.images.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto">
                          {dept.images.map((imageUrl, imgIndex) => (
                            <div
                              key={`${dept.id}-${imgIndex}`}
                              className="flex-shrink-0 overflow-hidden rounded-lg shadow-md w-72"
                            >
                              <Image
                                src={imageUrl}
                                alt={`${dept.name} image ${imgIndex + 1}`}
                                width={400}
                                height={300}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mb-6 text-base text-muted-foreground space-y-4 text-justify mt-5">
                        {dept.content.split('\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </ScrollReveal>
              ))}
            </Accordion>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
