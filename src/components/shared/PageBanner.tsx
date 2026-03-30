import Image from 'next/image';

interface PageBannerProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageHint: string;
  className?: string;
}

export function PageBanner({
  title,
  subtitle,
  imageUrl,
  imageHint,
  className,
}: PageBannerProps) {
  return (
    <section className="relative h-[40vh] w-full flex items-center justify-center text-center text-white font-nunito font-medium">
      <Image
        src={imageUrl}
        alt={title}
        fill
        style={{ objectFit: 'cover' }}
        className="absolute z-0"
        data-ai-hint={imageHint}
        priority
      />
      <div className="absolute inset-0 bg-black/20 z-10" />
      <div className="relative z-20 p-4">
        <h1 className="text-3xl md:text-5xl font-anton font-medium mb-2 drop-shadow-lg">
          {title}
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
