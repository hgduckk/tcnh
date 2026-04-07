"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, University } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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

  const NavLinks = ({ className }: { className?: string }) => (
    <nav className={cn("flex items-center gap-4 lg:gap-6", className)}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileMenuOpen(false)}
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
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 supports-[backdrop-filter]:bg-white/90">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 hover-glow">
          <img src="/images/logo.png" alt="ĐKTCNH Logo" className="h-8 w-auto" />
        </Link>

        <div className="hidden md:flex">
          <NavLinks />
        </div>

        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Chuyển đổi Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="p-4">
                <Link href="/" className="flex items-center gap-2 mb-8">
                  <University className="h-6 w-6 text-primary" />
                  <span className="font-headline text-xl font-bold"></span>
                </Link>
                <NavLinks className="flex-col items-start gap-4" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
