"use client";  

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { Footer } from '@/components/layout/Footer';
import { useEffect, useRef, useState } from "react";

interface SiteConfig {
  frontendUrl: string;
  adminPageUrl: string;
  showAdminLink: boolean;
  adminLinkLabel: string;
}

export default function Home() {
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const [videoInView, setVideoInView] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [settings, setSettings] = useState({
    homeBannerImage: '',
    homeImageOne: '',
    homeImageTwo: '',
    homeImageThree: '',
    youtubeVideoUrl: '',
    lastUpdated: '',
    contactFormTitle: 'Liên hệ với chúng tôi',
    contactFormSubtitle: 'Xin vui lòng cung cấp thông tin',
  });

  const fixedHomepageTitle = 'Đoàn khoa Tài chính - Ngân hàng';
  const fixedBannerSubtitle = 'ĐOÀN KHOA TÀI CHÍNH - NGÂN HÀNG';

  const parseYouTubeId = (value: string) => {
    const urlMatch = value.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    if (value.includes('?')) return value.split('?')[0];
    return value;
  };

  const videoId = parseYouTubeId(settings.youtubeVideoUrl || '');
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&modestbranding=1`;
  const imageVersion = settings.lastUpdated ? encodeURIComponent(settings.lastUpdated) : '';
  const withVersion = (src: string) => {
    if (!src || !imageVersion) return src;
    return src.includes('?') ? `${src}&v=${imageVersion}` : `${src}?v=${imageVersion}`;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setVideoInView(entry.isIntersecting));
      },
      { threshold: 0.5 }
    );

    if (videoSectionRef.current) observer.observe(videoSectionRef.current);

    return () => {
      if (videoSectionRef.current) observer.unobserve(videoSectionRef.current);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/home-settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Could not load admin settings:', error);
      }

      try {
        await fetch('/api/visits', { method: 'POST' });
      } catch {
        // ignore
      }
    }
    loadSettings();

    async function loadSiteConfig() {
      try {
        const res = await fetch('/api/site-config');
        if (res.ok) {
          setSiteConfig(await res.json());
        }
      } catch (error) {
        console.warn('Could not load site config:', error);
      }
    }

    loadSiteConfig();
  }, []);

  const carouselItems = [
    {
      image: "/images/achievement.png",
      hint: "achievement",
      title: "Nhấn vào",
      // description: "Nhấn để tìm hiểu thêm",
      link: "/achievements"
    },
    {
      image: "/images/activities.png",
      hint: "activities",
      title: "Nhấn vào",
      // description: "Nhấn để tìm hiểu thêm",
      link: "/activities"
    },
    {
      image: "/images/structure.png",
      hint: "structure",
      title: "Nhấn vào",
      // description: "Nhấn để tìm hiểu thêm",
      link: "/structure"
    },
    {
      image: "/images/blog.png",
      hint: "blog",
      title: "Nhấn vào",
      // description: "Nhấn để tìm hiểu thêm",
      link: "/blog"
    },
    {
      image: "/images/ai.png",
      hint: "ai",
      title: "Nhấn vào",
      // description: "Nhấn để tìm hiểu thêm",
      link: "/ai"
    },
    {
      image: "/images/a80.png",
      hint: "a80",
      title: "Coming soon",
      // description: "Nhấn để tìm hiểu thêm",
      link: "/a80"
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Banner Section */}
      <section className="relative w-full text-center">
        {settings.homeBannerImage?.trim() ? (
          <Image
            src={withVersion(settings.homeBannerImage)}
            alt="Finance - Banking Faculty Union"
            width={1920}
            height={1080}
            className="block w-full h-auto"
            priority
            data-ai-hint="university campus"
          />
        ) : (
          <div className="w-full h-0 bg-transparent" aria-hidden="true" />
        )}
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="space-y-16">
              <div className="flex flex-col md:flex-row items-center gap-12 ">
                <div className="md:w-1/2 space-y-4 text-center">
                  <h2 className="text-3xl md:text-4xl font-anton font-medium text-primary">
                    <span className="block md:inline">{fixedHomepageTitle}</span>{' '}
                  </h2> 
                  <p className="font-nunito text-muted-foreground text-lg text-justify">
                    Đoàn khoa Tài chính - Ngân hàng tự hào là lực lượng tiên phong trong công tác Đoàn và phong trào thanh niên tại Trường Đại học Kinh tế - Luật. Dưới sự dẫn dắt của Đoàn Trường và Chi ủy - Ban Chủ nhiệm Khoa, Đoàn khoa Tài chính - Ngân hàng luôn đem đến những hoạt động năng động, nhiệt huyết, với sự tham gia và cống hiến của đông đảo sinh viên.
                  </p>
                </div>
                <div className="md:w-1/2">
                  {settings.homeImageOne ? (
                    <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl min-h-[250px]">
                    <Image
                      src={withVersion(settings.homeImageOne)}
                      alt="Group of students"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      data-ai-hint="students collaborating"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 aspect-[4/3] flex items-center justify-center text-slate-400">
                      Chưa cập nhật hình ảnh 1
                    </div>
                  )}
                </div>
              </div>

            <h2 
              className="text-5xl md:text-5xl font-passions font-medium mt-0 text-center italic" 
              style={{ 
                color: '#f05a23', 
                textShadow: '0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700, 0 0 40px #FFD700' 
              }}
            >                
              "Giữa muôn vàn lựa chọn, chúng ta đã chọn cùng nhau đi qua những tháng năm rực rỡ nhất."
              </h2>
              
              <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                <div className="md:w-1/2 space-y-4 text-center">
                  <p className="font-nunito text-muted-foreground text-lg text-justify">
                  Mái nhà chung mang tên Đoàn khoa Tài chính - Ngân hàng, nơi các bạn có thể tìm thấy những người bạn đồng hành, những tri kỷ cùng chia sẻ đam mê, ước mơ và luôn an toàn, đáng tin cậy cho bạn hạ cánh viết tiếp những câu chuyện thanh xuân tươi đẹp khó phai. Bởi bằng ngọn lửa nhiệt huyết của tuổi trẻ, luôn sẵn sàng cống hiến vì những giá trị cộng đồng cùng tinh thần trách nhiệm và đoàn kết, Đoàn khoa Tài chính - Ngân hàng luôn là “tấm gương soi”, là cầu nối vững chắc, góp phần đưa các hoạt động Đoàn, các phong trào thanh niên tiêu biểu đến với các bạn sinh viên của Trường nói chung và sinh viên Khoa Tài chính - Ngân hàng nói riêng. 
                  </p>
                </div>
                <div className="md:w-1/2">
                  {settings.homeImageTwo ? (
                    <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl min-h-[250px]">
                      <Image
                        src={withVersion(settings.homeImageTwo)}
                        alt="Group of students"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        data-ai-hint="students collaborating"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 aspect-[4/3] flex items-center justify-center text-slate-400">
                      Chưa cập nhật hình ảnh 2
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="md:w-1/2 space-y-4 text-center">
                  <p className="font-nunito text-muted-foreground text-lg text-justify">
                  Với phương châm đặt lợi ích của sinh viên làm cốt lõi, từng hoạt động, chương trình của Đoàn Khoa không chỉ hứa hẹn sẽ tạo ra một môi trường năng động, sáng tạo và mang đậm dấu ấn riêng, mà còn góp phần nâng cao nhận thức chính trị, bồi dưỡng lý tưởng cách mạng cho đoàn viên, sinh viên. Các hoạt động được thiết kế nhằm hướng đến những nhu cầu thiết thực, kết hợp hài hòa giữa giáo dục chính trị – tư tưởng với phát triển kỹ năng và phong trào, qua đó đem lại cơ hội cho các bạn sinh viên thỏa sức khám phá bản thân, phát huy vai trò của tuổi trẻ, đồng thời lan tỏa những giá trị tích cực đến cộng đồng.
                  </p>
                </div>
                <div className="md:w-1/2">
                  {settings.homeImageThree ? (
                    <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-2xl min-h-[250px]">
                      <Image
                        src={withVersion(settings.homeImageThree)}
                        alt="Group of students"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        data-ai-hint="students collaborating"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 aspect-[4/3] flex items-center justify-center text-slate-400">
                      Chưa cập nhật hình ảnh 3
                    </div>
                  )}
                </div>
              </div>

            </div>
          </ScrollReveal>
        </div>
      </section>
      
      <h2 className="text-center text-2xl md:text-5xl font-anton font-medium text-primary mt-0">LÀ MỘT TÂN SINH VIÊN, BẠN SẼ CHỌN GÌ?</h2>
      {/* Video Section */}
      <section className="py-8 md:py-16" ref={videoSectionRef}>
        <div className="container mx-auto px-4">
          <div className="relative max-w-5xl mx-auto overflow-hidden rounded-xl shadow-2xl aspect-video">
            <div className="absolute right-3 top-3 z-20">
              <button
                onClick={() => setIsMuted((prev) => !prev)}
                className="rounded-md bg-black/60 px-3 py-1 text-sm text-white hover:bg-black"
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            {videoInView && videoId ? (
              <iframe
                className="w-full h-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                src={youtubeEmbedUrl}
                title="Home YouTube video"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-black flex items-center justify-center text-white">
                {videoId ? 'Cuộn xuống để phát video.' : 'Chưa cập nhật link video YouTube.'}
              </div>
            )}
          </div>
        </div>
<div className="flex justify-center mt-8">
  <Link href="/apply">
    <Button 
      className="px-8 py-6 text-xl font-bold rounded-full transition-all duration-300 hover:scale-105"
      style={{ backgroundColor: '#00aeef', 
      color: '#ffffff', boxShadow: '0 4px 15px rgba(0, 174, 239, 0.5)' }}
    >
      Ứng tuyển ngay!
    </Button>
  </Link>
</div>
      </section>

      {/* Carousel Section */}
      <section id="explore-section" className="py-16 md:py-24">
        <div className="container mx-auto px-9 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-anton font-medium text-primary mt-0 md:mt-0">
              TÌM HIỂU VỀ CHÚNG TỚ
            </h2>
            <p className="text-muted-foreground font-nunito font-semibold text-1xl md:text-3xl mx-auto mb-6 mt-5 md:mb-12">
              Các hoạt động, chương trình, sự kiện, thành tích nổi bật của Đoàn Khoa mình nè
            </p>
          </ScrollReveal>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-4xl mx-auto"
          >
            <CarouselContent>
              {carouselItems.map((item, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-1 h-full">
                    <ScrollReveal delayMs={80 * index}>
                      <Link href={item.link} className="h-full block">
                        <Card className="h-full flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={600}
                            height={400}
                            className="w-full h-48 object-cover"
                            data-ai-hint={item.hint}
                          />
                          <CardContent className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                              <h3 className="text-xl font-headline font-semibold mb-2">{item.title}</h3>
                              {/* <p className="text-muted-foreground text-sm">{item.description}</p> */}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </ScrollReveal>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 transform -translate-x-1/2" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-1/2" />
          </Carousel>
          
        </div>
      </section>
      <Footer />
    </div>
  );
}
