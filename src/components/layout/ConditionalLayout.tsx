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

  // 1. Trang Admin: Render thẳng nội dung (thường có dashboard riêng)
  if (isAdminPage) {
    return <>{children}</>;
  }

  // 2. Trang Bản đồ: Không Footer, không padding-top dư thừa để lấy không gian full-screen
  if (isSchoolMapPage) {
    return (
      <div className="min-h-dvh flex flex-col">
        <Header />
        {/* Main dùng flex-grow để chiếm toàn bộ không gian còn lại */}
        <main className="flex-grow relative z-0">
          {children}
        </main>
      </div>
    );
  }

  // 3. Normal Layout (Trang chủ, blog, v.v.):
  // Thêm pt-16 (64px) - đây chính là chiều cao của Header để nội dung không bị che khuất
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16 relative z-0">
        {children}
      </main>
    </div>
  );
}