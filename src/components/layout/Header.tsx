"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, University } from 'lucide-react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {/* THANH HEADER CHÍNH: Tự động ẩn giấu tùng tích (opacity-0 md:opacity-100) khi Menu Mobile đang mở */}
      <header 
        className={cn(
          "sticky top-0 z-[100] w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 transition-all duration-200",
          isMobileMenuOpen ? "opacity-0 pointer-events-none invisible md:visible md:opacity-100 md:pointer-events-auto" : "opacity-100 pointer-events-auto visible"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 hover-glow">
            <img src="/images/logo.png" alt="ĐKTCNH Logo" className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex">
            <NavLinks />
          </div>

          <div className="md:hidden flex items-center">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE DÙNG PORTAL RỜI BẮN THẲNG RA THẺ BODY */}
      {mounted && isMobileMenuOpen && createPortal(
        <div 
          className="md:hidden" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {/* Lớp nền đen mờ bao trọn khung nhìn thực tế */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Khung chứa Menu màu trắng ghim chặt góc phải */}
          <div 
            className="relative w-[280px] sm:w-[320px] bg-background shadow-2xl border-l flex flex-col p-6 animate-in slide-in-from-right duration-300 z-10 pointer-events-auto"
            style={{ 
              height: '100vh',
              position: 'absolute',
              top: 0,
              right: 0
            }}
          >
            
            {/* Nút Đóng (X) */}
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Logo và tiêu đề đầu Menu (Đảm bảo xuất hiện hoành tráng độc lập) */}
            <div className="flex items-center gap-2 mb-8 mt-4 select-none flex-shrink-0">
              <University className="h-6 w-6 text-primary" />
              <span className="font-headline text-xl font-bold text-foreground">ĐK TCNH</span>
            </div>

            {/* Danh sách các nút chuyển trang */}
            <div className="w-full overflow-y-auto pr-2 flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <NavLinks 
                className="flex flex-col items-start gap-6 w-full text-left" 
                onItemClick={() => setMobileMenuOpen(false)}
              />
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}