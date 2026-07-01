"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, University } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/achievements', label: 'Thành tích' },
  { href: '/activities', label: 'Hoạt động' },
  { href: '/structure', label: 'Cơ cấu' },
  { href: '/blog', label: 'Diễn đàn' },
  { href: '/apply', label: 'Ứng tuyển' },
  { href: '/youth', label: 'Tuổi trẻ' },
];

export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Khóa cuộn trang khi menu mobile mở
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const NavLinks = ({ className, onItemClick }: { className?: string; onItemClick?: () => void }) => (
    <nav className={cn("flex items-center gap-4 lg:gap-6", className)}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => {
            if (onItemClick) onItemClick();
          }}
          className={cn(
            "transition-colors hover:text-primary link-underline",
            pathname === item.href ? "text-primary font-semibold" : "text-muted-foreground",
            "text-base"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* THANH HEADER CHÍNH */}
      <header className="sticky top-0 z-[100] w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 hover-glow">
            <img src="/images/logo.png" alt="ĐKTCNH Logo" className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex">
            <NavLinks />
          </div>

          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE: NEO NGƯỢC TỪ ĐÁY LÊN ĐỂ CHỐNG LỖI ĐẨY LỆCH KHUNG TRÌNH DUYỆT */}
      {isMobileMenuOpen && (
        <div className="fixed bottom-0 left-0 right-0 h-[100dvh] z-[9999] md:hidden flex justify-end items-end">
          
          {/* Lớp nền đen mờ phủ từ đáy lên */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[100dvh] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Khung chứa Menu màu trắng: Neo từ bottom-0 và ép h-[100dvh] đầy đủ */}
          <div className="relative w-[280px] sm:w-[320px] bg-background h-[100dvh] max-h-[100dvh] bottom-0 right-0 shadow-2xl border-l flex flex-col p-6 animate-in slide-in-from-right duration-300 z-10 justify-start">
            
            {/* Nút Đóng (X) tự thiết kế */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Logo và tiêu đề đầu Menu */}
            <div className="flex items-center gap-2 mb-8 mt-4 select-none flex-shrink-0">
              <University className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold text-foreground">ĐK TCNH</span>
            </div>

            {/* Danh sách các nút chuyển trang (Bọc chặt luồng cuộn nội bộ) */}
            <div className="w-full overflow-y-auto pr-2 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <NavLinks 
                className="flex flex-col items-start gap-6 w-full text-left" 
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}