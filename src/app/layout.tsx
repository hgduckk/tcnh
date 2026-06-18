import type { Metadata } from 'next';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
import { getMetadataBaseUrl } from '@/lib/publicUrls';

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  title: 'ĐK-TCNH',
  description: 'Trang web của Đoàn khoa Tài chính - Ngân hàng',
  openGraph: {
    title: 'Đoàn khoa Tài chính - Ngân hàng',
    description: 'Trang web chính thức của Đoàn khoa Tài chính - Ngân hàng',
    siteName: 'ĐK-TCNH',
    images: [
      {
        url: '/images/backkipu.jpg',
        width: 1200,
        height: 630,
        alt: 'Đoàn khoa Tài chính - Ngân hàng',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Đoàn khoa Tài chính - Ngân hàng',
    description: 'Trang web chính thức của Đoàn khoa Tài chính - Ngân hàng',
    images: ['/images/backkipu.jpg'], 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <Toaster />
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
