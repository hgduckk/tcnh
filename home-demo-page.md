# Home Page Scroll Design Blueprint (BFAT Style)

## 1) Muc tieu tai tao giao dien "luot"

Tai tao home page co cam giac truot muot, dien anh, va co chieu sau khi cuon trang. Truc cam nhan mong muon:

- Scroll muot, co do tre nhe de tao cam giac "camera glide".
- Layering ro rang: background parallax + overlay gradient + text foreground.
- Header bien doi trang thai theo vi tri cuon (floating -> sticky notch).
- Chuyen canh giua cac section khong giat, giu nhip visual lien tuc.
- Footer sticky-reveal tao ket man hieu ung "curtain close".

---

## 2) Kien truc tong quan cua home page

Home duoc ghep tu 4 khoi theo thu tu:

1. Hero (full viewport, parallax nen + heading lon)
2. Featured (layout 2 cot, image + noi dung)
3. Promo (full viewport, parallax nguoc, text overlay)
4. Footer (sticky reveal)

Code composition (tham khao):

```tsx
<main className="relative bg-background">
  <Hero />
  <Featured />
  <Promo />
  <Footer />
</main>
```

---

## 3) Core interaction engine

### 3.1 Smooth scroll engine (Lenis)

Dung Lenis de lam mem native scroll, tao inertia nhe:

```tsx
useEffect(() => {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: true,
    touchMultiplier: 2,
    infinite: false,
  })

  function raf(time: number) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
  return () => lenis.destroy()
}, [])
```

Thong so quan trong can giu:

- `duration: 1.2`: du muot nhung khong gay delay kho chiu.
- `easing` exponential-out: giam toc tu nhien, khong bi "digital".
- `smoothTouch: true`, `touchMultiplier: 2`: mobile van co do "luot".

### 3.2 Scroll-linked animation (Framer Motion)

Dung `useScroll` + `useTransform` cho parallax theo tung section:

- Hero: `y: 0% -> 50%` khi section di qua viewport.
- Promo: `y: -20% -> 20%` de tao doi chieu chuyen dong.

Mau pattern:

```tsx
const container = useRef(null)
const { scrollYProgress } = useScroll({
  target: container,
  offset: ["start start", "end start"],
})
const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
```

---

## 4) Design language can copy

### 4.1 Layer visual (bat buoc)

Moi section full-screen nen theo 3 lop:

1. Background image/video (parallax)
2. Gradient overlay de control do doc text
3. Foreground content (heading/button)

Template layer:

```tsx
<div className="relative h-screen overflow-hidden">
  <motion.div className="absolute inset-0 z-0" style={{ y }}>
    {/* background media */}
  </motion.div>

  <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-black/10" />

  <div className="relative z-20">
    {/* content */}
  </div>
</div>
```

### 4.2 Typography hierarchy

- Heading cap 1: all-caps, serif, font-size lon (4xl -> clamp 2.5rem-4rem).
- Heading cap 2: tiep noi heading cap 1 de tao "editorial title".
- Body: ngan gon, uu tien line-height de de doc tren nen toi.
- Button: outline/trang toi gian, hover invert mau.

### 4.3 Contrast va readability

- Luon co overlay toi (`black/30` den `black/85`) truoc khi dat text trang.
- Dung `drop-shadow` cho heading tren image nhieu chi tiet.
- Tranh dat paragraph dai tren hero; de sang section sau.

---

## 5) Header behavior specification

Header co 2 trang thai:

1. Normal (khi o nua tren viewport):
- Rounded full (`rounded-full`)
- Nen den mo (`bg-black/50`) + blur vua (`backdrop-blur-md`)
- Padding rong hon (`px-6 py-3`)

2. Sticky mode (khi `scrollY > 50vh`):
- Thu nho nhe (`scale-[0.98]`)
- Rounded duoi (`rounded-b-3xl`)
- Nen den dam hon (`bg-black/80`) + blur manh (`backdrop-blur-xl`)
- Nut AI nho lai
- Xuat hien notch indicator o giua

Logic trigger:

```tsx
const triggerPoint = window.innerHeight * 0.5
setIsSticky(window.scrollY > triggerPoint)
```

Animation timing can copy:

- `transition: all 700ms cubic-bezier(0.23, 1, 0.32, 1)`
- keyframe `slideDown` cho notch/header luc vao sticky mode

---

## 6) Footer sticky reveal specification

Muc tieu: tao doan ket co cam giac footer duoc "keo len" khi cuon den cuoi.

Pattern ky thuat:

- Wrapper co `clipPath` de gioi han vung hien thi.
- Container cao hon viewport (`calc(100vh + footerHeight)`).
- Footer ben trong `position: sticky` va `top: calc(100vh - footerHeight)`.

Cong thuc tong quat:

```tsx
<div style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
  <div className="h-[calc(100vh+FOOTER_H)] -top-[100vh] relative">
    <div className="h-[FOOTER_H] sticky top-[calc(100vh-FOOTER_H)]">
      {/* footer content */}
    </div>
  </div>
</div>
```

---

## 7) Responsive behavior can copy

### Mobile

- Hero van full-height, heading co `clamp()` de tranh vo dong.
- Header an nav chinh (`md:flex`), giu logo + CTA can ban.
- Footer dung `h-[400px]`, text scale theo vw.

### Tablet

- Header nav bat dau hien.
- Feature section van stack doc neu chua du rong.

### Desktop

- Featured doi sang 2 cot (`lg:flex-row`).
- Hero heading cho phep max-size lon hon.
- Footer tang den `h-[800px]`.

---

## 8) Prompt mau de ban dung cho du an khac

Copy prompt duoi day de dua cho AI code tool:

```md
Build a cinematic one-page homepage with smooth scrolling and scroll-linked parallax, inspired by an editorial tech journal aesthetic.

TECH STACK:
- Next.js App Router + React
- Tailwind CSS
- Framer Motion
- Lenis for smooth scrolling

REQUIRED STRUCTURE:
1) Full-screen Hero section:
- Fixed/fill background image with parallax y transform from 0% to 50% based on local scroll progress
- Dark gradient overlay for readability
- Large serif uppercase title split into 2 lines
- Minimal outlined CTA button

2) Featured section (desktop 2 columns, mobile stacked):
- One large image block and one text block
- Generous whitespace, editorial typography

3) Promo section (full-screen):
- Another parallax background with opposite movement direction (e.g. -20% to 20%)
- Strong dark-to-transparent gradient overlay
- Right-aligned bold statement text

4) Sticky reveal footer:
- Implement clip-path wrapper + sticky footer technique so footer reveals as user reaches the end
- Include large typography branding and navigation/contact columns

SCROLL FEEL:
- Use Lenis with duration ~1.2 and exponential-out easing
- Keep smooth wheel + smooth touch enabled

HEADER BEHAVIOR:
- Floating glass header at top initially (rounded full, semi-transparent dark)
- When scrollY > 50vh: transform into sticky compact mode (rounded bottom notch style, stronger blur, smaller controls)
- Transition timing: ~700ms cubic-bezier(0.23, 1, 0.32, 1)

DESIGN TOKENS:
- Background-first layering: media (z0), overlay (z10), content (z20)
- High contrast white text on darkened media
- Serif display typography + clean sans body
- Avoid generic card-heavy SaaS look; keep it cinematic and minimal

RESPONSIVE:
- Works from mobile to desktop
- Preserve the visual mood and smoothness on touch devices

DELIVERABLE:
- Production-ready React components with clear separation:
  - HomePage
  - Hero
  - Featured
  - Promo
  - Header
  - Footer
- Include concise comments only for tricky animation/sticky logic.
```

---

## 9) Prompt nang cao (neu muon giong sat hon ban hien tai)

```md
Use one shared background image mood between Hero and Promo to maintain visual continuity.
Apply text shadows on hero heading for readability.
Use gradient overlays with alpha stops around:
- Hero: from black/60 via black/30 to black/10
- Promo: from black/85 via black/40 to transparent
For the header notch, render a small centered top glow element only in sticky mode.
Keep section heights mostly at 100vh except feature content blocks.
```

---

## 10) Checklist danh gia muc do giong

- Scroll wheel cam thay "glide", khong giat.
- Hero background di cham hon foreground khi cuon.
- Header doi trang thai ro rang sau ~50% viewport dau tien.
- Promo co chuyen dong doi huong voi Hero.
- Footer reveal dung sticky, khong nhay layout.
- Mobile van dep, text khong tran man hinh.

Neu can ban "sat pixel" hon nua, ban co the bo sung thong so cu the cho font family, spacing scale, va image composition (focal point) theo brand moi.
