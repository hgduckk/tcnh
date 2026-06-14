export const dynamic = 'force-dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { PageBanner } from '@/components/shared/PageBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CommentSystem } from '@/components/blog/CommentSystem';
import { TestimonialsSection } from '@/components/blog/TestimonialsSection';

export default function BlogPage() {
  return (
    <>
      <PageBanner
        title="GÓC TÂM SỰ"
        subtitle="Nơi chia sẻ những cảm xúc thầm kín..."
        imageUrl="/images/back-ocean.jpg"
        imageHint="community discussion"
      />

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">

            {/* Comment Section */}
            <div className="mt-16">
              <CommentSystem />
            </div>

            {/* Testimonials */}
            <h2 className="text-2xl md:text-4xl font-anton font-medium mb-8 text-primary text-center mt-12">Góc chia sẻ</h2>
            <TestimonialsSection />
            

          </div>

          {/* Fanpage Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardHeader>
                <h3 className="text-2xl md:text-3xl text-center text-primary font-headline font-semibold">FANPAGE</h3>
              </CardHeader>
              <CardContent>
                <Image
                  src="/images/banner.jpg"
                  alt="Fanpage preview"
                  width={400}
                  height={250}
                  className="rounded-lg mb-4 w-full h-auto object-cover"
                  data-ai-hint="social media page"
                />
                <p className="text-muted-foreground mb-4">
                  Hãy theo dõi fanpage của chúng tớ để cập nhật những thông tin mới nhất về các hoạt động của Khoa, Trường nhaa.
                </p>
                <Button asChild className="w-full">
                  <Link href="https://www.facebook.com/tcnh.uel" target="_blank" rel="noopener noreferrer">Ghé thăm Fanpage</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
