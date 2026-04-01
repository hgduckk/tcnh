"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/shared/PageBanner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { useState } from "react";
import { Footer } from '@/components/layout/Footer';

export function FeaturedAchievement() {
  const images = [
    "/images/achievements/thaitran1.jpg",
    "/images/achievements/thaitran2.jpg",
    "/images/achievements/thaitran3.jpg",
    "/images/achievements/thaitran4.jpg",
    "/images/achievements/thaitran5.jpg",
    "/images/achievements/thaitran6.jpg",

  ];

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
  const achievements = [
    {
      title: '04 năm liên tục hoàn thành xuất sắc nhiệm vụ trong công tác Đoàn và phong trào thanh niên Trường Đại học Kinh tế - Luật (2018 - 2019, 2019 - 2020, 2020 - 2021, 2021 - 2022). Trong đó Đoàn Khoa vinh dự nhận Lá cờ đầu năm học 2019 - 2020',
      // description: 'Được công nhận vì đã quyên góp được số tiền cao nhất cho hoạt động từ thiện hàng năm của trường đại học.',
      imageUrl: '/images/achievements/7.jpg',
      imageHint: '7',
    },
    {
      title: 'Giấy khen tập thể Đoàn khoa Tài chính - Ngân hàng Đoàn Trường ĐH Kinh tế - Luật "Đã có đóng góp tích cực trong Công tác Đoàn và phong trào thanh niên ĐHQG-HCM năm học 2024 - 2025" của Đoàn ĐHQG-HCM tại Hội nghị tổng kết Công tác Đoàn - Hội năm học',
      // description: 'Được công nhận vì đã quyên góp được số tiền cao nhất cho hoạt động từ thiện hàng năm của trường đại học.',
      imageUrl: '/images/achievements/1.jpg',
      imageHint: '1',
    },
    {
      title: 'Đạt thành tích tốt trong Tháng thanh niên Trường Đại học Kinh tế - Luật 2025. Chủ đề "Tuổi trẻ Kinh tế - Luật tự hào, vững tin theo Đảng"',
      // description: 'Được vinh danh cho chuỗi hội thảo và dạy kèm của chúng tôi đã cải thiện đáng kể điểm số của sinh viên.',
      imageUrl: '/images/achievements/2.jpeg',
      imageHint: '2',
    },
    {
      title: 'Hoàn thành xuất sắc nhiệm vụ Tháng thanh niên Trường Đại học Kinh tế - Luật 2021. Chủ đề: "Tự hào truyền thống Đoàn TNCS Hồ Chí Minh"',
      // description: 'Được trao giải cho các sáng kiến tình nguyện thành công và quan hệ đối tác bền chặt của chúng tôi với các doanh nghiệp địa phương.',
      imageUrl: '/images/achievements/3.jpg',
      imageHint: '3',
    },
    {
      title: 'Bằng khen Đoàn khoa Tài chính - Ngân hàng Đoàn Trường ĐH Kinh tế - Luật về Thực hiện tốt Chương trình hành động về “Tăng cường sự lãnh đạo của Đảng đối với công tác giáo dục lý tưởng cách mạng, đạo đức, lối sống văn hóa cho thế hệ trẻ giai đoạn 2015 - 2030" của BTV Thành đoàn TP. HCM',
      // description: 'Được công nhận vì đã quyên góp được số tiền cao nhất cho hoạt động từ thiện hàng năm của trường đại học.',
      imageUrl: '/images/achievements/4.jpg',
      imageHint: '4',
    },
    {
      title: 'Giấy khen tập thể Đoàn khoa Tài chính - Ngân hàng Đoàn Trường ĐH Kinh tế - Luật "Đã có đóng góp tích cực trong Công tác Đoàn và phong trào thanh niên ĐHQG-HCM" giai đoạn 2019 - 2022 của Ban Cán sự Đoàn ĐHQG-HCM',
      // description: 'Được công nhận vì đã quyên góp được số tiền cao nhất cho hoạt động từ thiện hàng năm của trường đại học.',
      imageUrl: '/images/achievements/5.jpg',
      imageHint: '5',
    },
    {
      title: 'Giấy khen tập thể Đoàn khoa Tài chính - Ngân hàng Đoàn Trường ĐH Kinh tế - Luật "Đã có thành tích xuất sắc trong Công tác Đoàn và phong trào thanh niên ĐHQG-HCM năm học 2020 - 2021" của Ban Cán sự Đoàn ĐHQG-HCM',
      // description: 'Được công nhận vì đã quyên góp được số tiền cao nhất cho hoạt động từ thiện hàng năm của trường đại học.',
      imageUrl: '/images/achievements/6.jpg',
      imageHint: '6',
    },
    {
      title: 'Đạt giải Nhất Vòng Chung khảo và Trao giải liên hoan các tiểu phẩm tuyên truyền “Tôi - Thanh niên Thành phố văn minh”',
      // description: 'Được công nhận vì đã quyên góp được số tiền cao nhất cho hoạt động từ thiện hàng năm của trường đại học.',
      imageUrl: '/images/achievements/8.jpg',
      imageHint: '8',
    },
    {
      title: 'Đạt giải Nhất môn Bóng đá, môn Cờ caro người; giải ba môn Kéo co và xếp hạng thứ Nhất toàn Đoàn tại Hội thao Cán bộ Đoàn - Hội 2024',
      // description: 'Được công nhận vì đã quyên góp được số tiền cao nhất cho hoạt động từ thiện hàng năm của trường đại học.',
      imageUrl: '/images/achievements/9.jpg',
      imageHint: '9',
    },

  ];

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
        <FeaturedAchievement/>
        <h2 className="text-4xl md:text-5xl font-anton font-medium text-primary mt-14 md:mt-20 text-center">THÀNH TÍCH TIÊU BIỂU</h2>
        <div className="mt-5 grid grid-cols-1 gap-8 place-items-center">
          {achievements.map((achievement, index) => (
            <ScrollReveal key={index} delayMs={80 * index}>
              <Card className="w-full max-w-4xl overflow-hidden shadow-lg hover:shadow-3xl transition-all duration-300 group mt-10">
                <div className="flex flex-col md:flex-row">
                  <CardContent className="p-0 md:w-1/2 flex justify-center">
                    <div className="w-full max-w-[400px] h-[250px] md:h-[300px] overflow-hidden rounded-lg transition-transform duration-500 group-hover:scale-105">
                      <Image
                        src={achievement.imageUrl}
                        alt={achievement.title}
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                        data-ai-hint={achievement.imageHint}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 md:w-1/2 flex flex-col justify-center bg-background">
                    <h3 className=" font-nunito text-lg font-semibold text-primary text-justify">{achievement.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground text-justify"></p>
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
