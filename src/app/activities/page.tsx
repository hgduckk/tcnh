"use client";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hoạt động',
};
export const dynamic = 'force-dynamic';
import Image from 'next/image';
import { PageBanner } from '@/components/shared/PageBanner';
import { Card } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import { useEffect, useState } from 'react';
import { ACTIVITY_TYPE_LABELS, type ActivityRow } from '@/lib/activities';
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

    const categoryItems = activities.filter((activity) => activity.activity_type === 'category');
    const programItems = activities.filter((activity) => activity.activity_type === 'program');
    const defaultTab = categoryItems.length > 0 ? 'category' : 'program';

    const renderActivityList = (items: ActivityRow[], emptyMessage: string) => {
        if (items.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="space-y-12">
                {items.map((activity, idx) => (
                    <ScrollReveal key={activity.id} delayMs={80 * idx}>
                        <Card className="overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 grid md:grid-cols-2 bg-white">
                            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 flex items-center justify-center">
                                {activity.images && activity.images.length > 0 ? (
                                    <Carousel className="w-full max-w-sm" opts={{ loop: true }}>
                                        <CarouselContent>
                                            {activity.images.map((imageUrl, imageIndex) => (
                                                <CarouselItem key={imageIndex}>
                                                    <Image
                                                        src={imageUrl}
                                                        alt={`${activity.name} image ${imageIndex + 1}`}
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
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70 mb-3">
                                    {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                                </p>
                                <h3 className="font-headline text-3xl font-bold text-primary text-justify mb-4">{activity.name}</h3>
                                <p className="text-muted-foreground leading-relaxed text-justify">{activity.description}</p>
                            </div>
                        </Card>
                    </ScrollReveal>
                ))}
            </div>
        );
    };

    return (
        <div>
            <PageBanner
                title="HOẠT ĐỘNG CỦA CHÚNG TỚ"
                subtitle="Các chuyên mục và chương trình nổi bật mà Đoàn Khoa đã thực hiện."
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
                    <Tabs defaultValue={defaultTab} className="space-y-8">
                        <div className="flex justify-center">
                            <TabsList className="grid w-full max-w-xl grid-cols-2 h-auto rounded-full bg-slate-100 p-1">
                                <TabsTrigger value="category" className="rounded-full px-6 py-3 text-sm md:text-base">
                                    Chuyên mục
                                </TabsTrigger>
                                <TabsTrigger value="program" className="rounded-full px-6 py-3 text-sm md:text-base">
                                    Chương trình
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="category" className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl md:text-4xl font-anton text-primary">{ACTIVITY_TYPE_LABELS.category}</h2>
                                <p className="text-muted-foreground">Nội dung chia sẻ, lan tỏa và đồng hành cùng sinh viên.</p>
                            </div>
                            {renderActivityList(categoryItems, 'Chưa có chuyên mục nào để hiển thị.')}
                        </TabsContent>

                        <TabsContent value="program" className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl md:text-4xl font-anton text-primary">{ACTIVITY_TYPE_LABELS.program}</h2>
                                <p className="text-muted-foreground">Những chương trình, sự kiện và hoạt động nổi bật của Đoàn Khoa.</p>
                            </div>
                            {renderActivityList(programItems, 'Chưa có chương trình nào để hiển thị.')}
                        </TabsContent>
                    </Tabs>
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
