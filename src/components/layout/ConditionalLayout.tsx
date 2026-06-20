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
  // Đã sửa để bỏ overflow-hidden làm hỏng sticky của Header
  if (isSchoolMapPage) {
    return (
      // Sử dụng min-h-dvh cho full height viewport mượt mà trên mobile
      <div className="min-h-dvh flex flex-col">
        {/* Header nằm trong flex container chuẩn để sticky top-0 hoạt động */}
        <Header />
        {/* Main vẫn chiếm phần còn lại, relative giúp map và floating elements nằm đúng vị trí */}
        <main className="flex-grow relative z-0"> 
          {children}
        </main>
      </div>
    );
  }

  // 3. Normal Layout (Trang chủ, blog, v.v.): Có Header + Footer + padding-top
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Thêm pt-16 (tương ứng chiều cao Header) để không bị đè */}
      <main className="flex-grow pt-16 relative z-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}