"use client";

import React, { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
  className?: string;
  once?: boolean;
  delayMs?: number;
};

export function ScrollReveal({ children, className, once = true, delayMs = 0 }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            if (delayMs > 0) {
              target.style.animationDelay = `${delayMs}ms`;
            }
            target.classList.add('reveal-in');
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            (entry.target as HTMLElement).classList.remove('reveal-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, delayMs]);

  return (
    <div ref={ref} className={['reveal', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}





