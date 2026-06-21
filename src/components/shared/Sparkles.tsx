"use client";

import React, { useEffect, useState } from 'react';

type Dot = { left: string; top: string; delay: string };

export function Sparkles({ count = 60 }: { count?: number }) {
  const [mounted, setMounted] = useState(false);
  const [dots, setDots] = useState<Dot[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const next: Dot[] = Array.from({ length: count }).map(() => {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const delay = (Math.random() * 2.0).toFixed(2);
      return { left: `${left}%`, top: `${top}%`, delay: `${delay}s` };
    });
    setDots(next);
  }, [mounted, count]);

  if (!mounted) return null;

  return (
    <div className="sparkles" aria-hidden>
      {dots.map((d, i) => (
        <div
          key={i}
          className="dot"
          style={{ left: d.left, top: d.top, animationDelay: d.delay }}
        />
      ))}
    </div>
  );
}


