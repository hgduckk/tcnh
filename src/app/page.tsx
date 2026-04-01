"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";

function HeroSection() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <section ref={heroRef} className="relative h-screen overflow-hidden">
      <motion.div className="absolute inset-0 z-0" style={{ y }}>
        <Image
          src="/images/backkipu.jpg"
          alt="Doan khoa TCNH"
          fill
          priority
          className="object-cover"
        />
      </motion.div>

      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#08101a]/85 via-[#08101a]/35 to-[#08101a]/5" />
      <div className="absolute -left-20 top-24 z-10 h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl md:h-80 md:w-80" />
      <div className="absolute -right-28 bottom-16 z-10 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl md:h-96 md:w-96" />

      <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-end px-5 pb-20 md:items-center md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <p className="mb-4 font-['Space_Grotesk'] text-xs uppercase tracking-[0.32em] text-cyan-100/90 md:mb-5">
            UEL FINANCE AND BANKING YOUTH UNION
          </p>
          <h1 className="font-['PT_Sans'] text-4xl font-bold uppercase leading-[0.95] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:text-5xl md:text-7xl lg:text-8xl">
            Noi Khoi Dau
            <span className="block text-cyan-100">Nang Luc Tre</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm text-white/85 md:text-lg">
            Khong gian ket noi, sang tao va hanh dong cua sinh vien TCNH voi nhung hanh trinh
            phong trao day cam hung va gia tri cong dong ben vung.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/apply"
              className="rounded-full border border-white/30 bg-white px-6 py-2.5 font-['Space_Grotesk'] text-xs font-bold uppercase tracking-[0.2em] text-black transition-transform hover:-translate-y-0.5"
            >
              Ung tuyen ngay
            </Link>
            <Link
              href="/activities"
              className="rounded-full border border-white/35 bg-black/25 px-6 py-2.5 font-['Space_Grotesk'] text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black"
            >
              Kham pha hanh trinh
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedSection() {
  return (
    <section className="relative bg-[#f2ede2] py-20 text-[#101116] md:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[1.8rem] shadow-[0_30px_70px_rgba(17,24,39,0.18)]"
        >
          <Image
            src="/images/doankhoa1.jpg"
            alt="Sinh vien tham gia hoat dong"
            width={1200}
            height={900}
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-['Space_Grotesk'] text-xs uppercase tracking-[0.28em] text-[#2f6472]">
            Featured Story
          </p>
          <h2 className="mt-4 font-['PT_Sans'] text-3xl font-bold uppercase leading-tight md:text-5xl">
            Dao tao ban linh
            <span className="block">tu nhung du an that</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-black/75 md:text-lg">
            Moi chuong trinh la mot bai toan thuc te de sinh vien ren ky nang to chuc, truyen
            thong, lanh dao va lam viec nhom trong boi canh da nhiem vu.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/structure"
              className="rounded-full border border-black/20 bg-black px-5 py-2.5 font-['Space_Grotesk'] text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1e293b]"
            >
              Xem co cau
            </Link>
            <Link
              href="/achievements"
              className="rounded-full border border-black/20 px-5 py-2.5 font-['Space_Grotesk'] text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
            >
              Thanh tich
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PromoSection() {
  const promoRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: promoRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <section ref={promoRef} className="relative h-screen overflow-hidden">
      <motion.div className="absolute inset-0 z-0" style={{ y }}>
        <Image src="/images/doankhoa2.jpg" alt="Khoanh khac thanh xuan" fill className="object-cover" />
      </motion.div>

      <div className="absolute inset-0 z-10 bg-gradient-to-l from-black/85 via-black/45 to-transparent" />

      <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-center justify-end px-5">
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-right"
        >
          <p className="font-['Space_Grotesk'] text-xs uppercase tracking-[0.3em] text-cyan-100/85">Promo</p>
          <h2 className="mt-3 font-['PT_Sans'] text-4xl font-bold uppercase leading-[1.03] text-white md:text-6xl">
            Khong chi la phong trao
            <span className="block">do la hanh trinh lon len</span>
          </h2>
          <p className="mt-5 ml-auto max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            Moi chuong trinh la mot co hoi de ket noi, de phat trien va de luu giu nhung ky
            niem dep nhat cua tuoi tre UEL.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function VisualGridSection() {
  const cards = [
    {
      title: "Hoat dong noi bat",
      desc: "Cap nhat chuong trinh, su kien va khoanh khac dang nho cua nam hoc.",
      href: "/activities",
      image: "/images/sections/3/1.jpg",
    },
    {
      title: "Thanh tich tap the",
      desc: "Tong hop cot moc noi bat trong hoc tap, phong trao va cong dong.",
      href: "/achievements",
      image: "/images/achievements/2.jpg",
    },
    {
      title: "Gia nhap cung chung toi",
      desc: "Ung tuyen va bat dau hanh trinh phat trien cung Doan khoa TCNH.",
      href: "/apply",
      image: "/images/programn/4/2.jpg",
    },
  ];

  return (
    <section className="bg-[#08131b] py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 md:mb-10"
        >
          <p className="font-['Space_Grotesk'] text-xs uppercase tracking-[0.28em] text-cyan-100/80">Storyline</p>
          <h2 className="mt-3 font-['PT_Sans'] text-3xl font-bold uppercase leading-tight text-white md:text-5xl">
            Nhung diem nhan
            <span className="block text-cyan-100">trong hanh trinh sinh vien</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative overflow-hidden rounded-2xl border border-white/15"
            >
              <Image
                src={item.image}
                alt={item.title}
                width={800}
                height={560}
                className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/85" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-['PT_Sans'] text-2xl font-bold uppercase text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-white/80">{item.desc}</p>
                <Link
                  href={item.href}
                  className="mt-4 inline-flex rounded-full border border-white/35 px-4 py-2 font-['Space_Grotesk'] text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white hover:text-black"
                >
                  Xem them
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      syncTouch: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    let rafId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="bg-[#07131c] text-white">
      <main className="relative z-0 overflow-x-clip">
        <HeroSection />
        <FeaturedSection />
        <PromoSection />
        <VisualGridSection />
      </main>
    </div>
  );
}
