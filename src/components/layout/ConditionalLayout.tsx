"use client";

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';
  const isSchoolMapPage = pathname === '/youth/school-map';

  // 1. Trang Admin: Không dùng Header/Footer
  if (isAdminPage) {
    return <>{children}</>;
  }

  // 2. Trang Bản đồ: Để Header dính nhưng không chặn scroll của map
  if (isSchoolMapPage) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    );
  }

  // 3. Normal Layout (Trang chủ, blog, v.v.): Có Header + Footer + pt-16
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}