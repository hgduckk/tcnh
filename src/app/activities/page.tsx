"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/shared/PageBanner';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import { useEffect, useState } from 'react';
import type { ActivityRow } from '@/lib/activities';
import type { PartnerRow } from '@/lib/partners';

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<ActivityRow[]>([]);
    const [partners, setPartners] = useState<PartnerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [activitiesRes, partnersRes] = await Promise.all([
                    fetch('/api/activities', { cache: 'no-store' }),
                    fetch('/api/partners', { cache: 'no-store' })
                ]);
                
                if (!activitiesRes.ok) throw new Error('Failed to fetch activities');
                const activitiesJson = await activitiesRes.json();
                setActivities(Array.isArray(activitiesJson?.data) ? activitiesJson.data : []);
                
                if (partnersRes.ok) {
                    const partnersJson = await partnersRes.json();
                    setPartners(Array.isArray(partnersJson?.data) ? partnersJson.data : []);
                }
            } catch (err) {
                setError(String(err));
                setActivities([]);
                setPartners([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <PageBanner
                title="HOẠT ĐỘNG CỦA CHÚNG TỚ"
                subtitle="Các chương trình và sự kiện hấp dẫn mà Đoàn Khoa đã tổ chức."
                imageUrl="/images/back-ocean.jpg"
                imageHint="students event"
            />

            <main className="container mx-auto px-8 py-16 md:py-24">
                {loading && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Đang tải hoạt động...</p>
                    </div>
                )}

                {error && (
                    <div className="text-center py-12">
                        <p className="text-red-600">Lỗi: {error}</p>
                    </div>
                )}

                {!loading && !error && activities.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Chưa có hoạt động nào để hiển thị.</p>
                    </div>
                )}

                {!loading && !error && activities.length > 0 && (
                    <div className="space-y-12">
                        {activities.map((activity, idx) => (
                            <ScrollReveal key={activity.id} delayMs={80 * idx}>
                              <Card className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 grid md:grid-cols-2 bg-white">
                                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
                                    {activity.images && activity.images.length > 0 ? (
                                        <Carousel className="w-full max-w-sm" opts={{loop: true}}>
                                            <CarouselContent>
                                                {activity.images.map((imageUrl, i) => (
                                                    <CarouselItem key={i}>
                                                        <Image 
                                                            src={imageUrl} 
                                                            alt={`${activity.name} image ${i + 1}`} 
                                                            width={600} 
                                                            height={400} 
                                                            className="rounded-xl object-cover transform transition-transform duration-300 hover:scale-105"
                                                        />
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            {activity.images.length > 1 && (
                                                <>
                                                    <CarouselPrevious className="absolute top-1/2 -translate-y-1/2 left-2 text-white bg-transparent hover:bg-transparent" />
                                                    <CarouselNext className="absolute top-1/2 -translate-y-1/2 right-2 text-white bg-transparent hover:bg-transparent" />
                                                </>
                                            )}
                                        </Carousel>
                                    ) : (
                                        <div className="w-full max-w-sm aspect-video rounded-xl bg-muted flex items-center justify-center">
                                            <p className="text-muted-foreground">Không có hình ảnh</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 flex flex-col justify-center">
                                    <h3 className="font-headline text-3xl font-bold text-primary text-justify mb-4">{activity.name}</h3>
                                    <p className="text-muted-foreground leading-relaxed text-justify">{activity.description}</p>
                                </div>
                              </Card>
                            </ScrollReveal>
                        ))}
                    </div>
                )}
                
                {/* Partners Section */}
                <section className="mt-24">
                    <h2 className="text-4xl md:text-5xl font-anton font-medium text-center mb-0 md:mb-14 text-primary mt-0 md:mt-14">CÁC ĐƠN VỊ ĐÃ HỢP TÁC</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 items-center">
                        {partners.map((partner, index) => (
                            <div key={`${partner.name}-${index}`} className="flex justify-center " title={partner.name}>
                                <Image 
                                    src={partner.logo_url} 
                                    alt={`${partner.name} logo`}
                                    width={150}
                                    height={80}
                                    className="object-contain w-auto h-[80px] mt-14"
                                    data-ai-hint={partner.name}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
