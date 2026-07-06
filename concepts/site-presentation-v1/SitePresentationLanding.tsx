"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useMotionValue, useSpring, type MotionValue } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  MagnifyingGlass,
  PlusCircle,
  ChatsCircle,
  Wrench,
  Flag,
  ListChecks,
  CalendarCheck,
  BellRinging,
  Clock,
  Star,
  Robot,
  Lightning,
  Sparkle,
  MapTrifold,
  TelegramLogo,
} from "@phosphor-icons/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 140, damping: 18 } as const;

/* ── scroll reveal ── */
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24, filter: "blur(5px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ── fixed film grain ── */
function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] opacity-[0.05] mix-blend-soft-light"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/* ── the treasure route: a curvy line that draws itself as you scroll ──
   The path is generated from the real page height (measured with a
   ResizeObserver), so dashes and curves keep their proportions instead of
   being stretched by preserveAspectRatio. Visible on all breakpoints:
   thin at the very left edge on mobile, wider at lg+. */
const ROUTE_END_OFFSET = 150; // px above the page bottom where the X sits

function buildRoutePath(h: number) {
  const end = h - ROUTE_END_OFFSET;
  const seg = 560; // one S-curve per ~560px of page
  let d = `M20 8`;
  let y = 8;
  let side = 1;
  while (y < end - seg) {
    const next = Math.min(y + seg, end);
    d += ` C ${20 + 17 * side} ${y + seg * 0.35}, ${20 - 15 * side} ${y + seg * 0.7}, 20 ${next}`;
    y = next;
    side = -side;
  }
  d += ` L 20 ${end}`;
  return d;
}

function TreasureRoute({ progress }: { progress: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const cometTop = useTransform(progress, [0, 1], [8, Math.max(h - ROUTE_END_OFFSET, 8)]);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-y-0 left-0.5 z-40 w-6 sm:left-2 lg:left-4 lg:w-10 xl:left-8">
      {h > 0 && (
        <>
          <svg viewBox={`0 0 40 ${h}`} preserveAspectRatio="none" fill="none" className="h-full w-full">
            <path d={buildRoutePath(h)} stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="2.6" strokeDasharray="3 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="[filter:drop-shadow(0_0_3px_color-mix(in_oklch,var(--accent),transparent_45%))]" />
            <motion.path
              d={buildRoutePath(h)}
              stroke="var(--accent)"
              strokeWidth="3.2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: progress }}
              className="[filter:drop-shadow(0_0_7px_color-mix(in_oklch,var(--accent),transparent_25%))]"
            />
          </svg>
          <motion.div
            style={{ top: cometTop }}
            className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_22px_6px_color-mix(in_oklch,var(--accent),transparent_38%)]"
          />
          {/* X marks the spot — generated treasure-map cross; sits where the route ends */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ top: h - ROUTE_END_OFFSET }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site/cross.png" alt="" className="h-12 w-12 max-w-none lg:h-[82px] lg:w-[82px]" />
          </motion.div>
        </>
      )}
    </div>
  );
}

/* ── magnetic CTA (motion values, no re-render) ── */
function Magnetic({ href, children, variant = "accent", className }: { href: string; children: ReactNode; variant?: "accent" | "ghost"; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 14 });
  const sy = useSpring(y, { stiffness: 200, damping: 14 });
  const base =
    variant === "accent"
      ? "bg-accent text-accent-foreground"
      : "border border-white/15 bg-white/[0.03] text-foreground hover:border-white/30";
  return (
    <motion.a
      href={href}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.28);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: sx, y: sy }}
      className={`group inline-flex items-center gap-3 rounded-full py-3.5 pl-6 pr-2 text-[0.95rem] font-semibold transition-colors duration-300 ${base} ${className ?? ""}`}
    >
      <span>{children}</span>
      <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${variant === "accent" ? "bg-black/15" : "bg-white/10"}`}>
        <ArrowUpRight size={17} weight="bold" />
      </span>
    </motion.a>
  );
}

function Eyebrow({ children, step }: { children: ReactNode; step?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-3.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
      {step ? (
        <span className="flex h-5 items-center rounded-full bg-accent px-2 font-bold text-accent-foreground">{step}</span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      )}
      {children}
    </span>
  );
}

const channels = [
  { label: "Telegram", href: "https://t.me/foggearthquake_bot", note: "@foggearthquake_bot" },
  { label: "Почта", href: "mailto:ainur@gabdra.pw", note: "ainur@gabdra.pw" },
];

const contour = [
  { icon: <ListChecks size={22} weight="duotone" />, title: "Вся информация в одном месте", text: "Цены, меню, услуги, возможности. Человек заходит и сразу понимает, что у вас есть и сколько стоит." },
  { icon: <CalendarCheck size={22} weight="duotone" />, title: "Запись, заказ и доставка на странице", text: "Клиент сам выбирает услугу и записывается или оформляет доставку — без звонка и переписки в пяти местах." },
  { icon: <BellRinging size={22} weight="duotone" />, title: "Заявка сразу падает вам", text: "Каждое обращение прилетает в Telegram, ВК или MAX — куда удобно. Ничего не теряется в директах." },
  { icon: <Star size={22} weight="duotone" />, title: "Фото, портфолио и доверие", text: "Живые работы, отзывы, понятная подача. Человек видит уровень до того, как позвонит." },
];

const steps = [
  { n: "01", icon: <MagnifyingGlass size={22} weight="regular" />, title: "Собираю всё сам", text: "Беру вашу информацию из открытых источников — ВК, 2ГИС, Яндекс.Карты. От вас на старте почти ничего не нужно.", out: "Черновой контент готов" },
  { n: "02", icon: <PlusCircle size={22} weight="regular" />, title: "Вы добавляете сверх", text: "То, чего нет в сети: актуальные цены, спецпредложения, живые фото, детали услуг.", out: "Актуальные цены и фото" },
  { n: "03", icon: <ChatsCircle size={22} weight="regular" />, title: "Договариваемся, как будет выглядеть", text: "Показываю черновой макет. Решаем вместе: какие блоки, какой стиль, что внутри.", out: "Макет утверждён" },
  { n: "04", icon: <Wrench size={22} weight="regular" />, title: "Собираю и подключаю", text: "Фото и портфолио, форму заявок, запись и доставку, интеграции с YClients или ВКонтакте.", out: "Сайт собран и работает" },
  { n: "05", icon: <Flag size={22} weight="fill" />, title: "Запускаю — и клиенты приходят", text: "Всё в одном месте, весь путь клиента закрыт, заявки летят вам. Дальше — поддержка и правки.", out: "Клиенты идут к вам" },
];

const scope = [
  { icon: <Robot size={22} weight="duotone" />, title: "Чат-боты", text: "Отвечают на частые вопросы за вас — в ВК, Telegram и на сайте." },
  { icon: <Lightning size={22} weight="duotone" />, title: "Автоматизация рутины", text: "Напоминания о записи, сбор отзывов, выгрузки — без ручной работы." },
  { icon: <ChatsCircle size={22} weight="duotone" />, title: "Единая заявка из всех каналов", text: "ВК, сайт, форма, мессенджеры — всё в одном окне, ничего не теряется." },
];

const mockups = [
  { src: "/site/example-cafe.png", label: "Кофейня", caption: "Меню, бронь стола и заявка — на одной быстрой странице." },
  { src: "/site/example-salon.png", label: "Салон красоты", caption: "Онлайн-запись, услуги и цены — клиент записывается сам." },
  { src: "/site/example-barber.png", label: "Барбершоп", caption: "Запись на стрижку и услуги — коротко и по делу." },
  { src: "/site/example-flowers.png", label: "Цветочный", caption: "Витрина букетов и заказ доставки в пару касаний." },
  { src: "/site/example-bakery.png", label: "Пекарня", caption: "Витрина, самовывоз и доставка — заказ со страницы." },
  { src: "/site/example-auto.png", label: "Автосервис", caption: "Заявка на диагностику и запись — ничего не теряется." },
];

const cycle = [
  { src: "/site/flow-services.png", cap: "Смотрит услуги и цены — всё понятно сразу" },
  { src: "/site/flow-booking.png", cap: "Выбирает и записывается — сам, без звонка" },
  { src: "/site/flow-notify.png", cap: "Заявка падает вам — в Telegram, ВК или MAX" },
];

function LeadForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_or_email: String(fd.get("telegram_or_email") || ""),
          project_summary: String(fd.get("project_summary") || ""),
          consent: fd.get("consent") === "on",
          website: String(fd.get("website") || ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === "success") {
        setStatus("ok");
        setMessage(data.message || "Заявка отправлена. Скоро вернусь с макетом.");
        form.reset();
      } else {
        setStatus("err");
        setMessage(data.message || "Не отправилось. Напишите в мессенджер — так точно дойдёт.");
      }
    } catch {
      setStatus("err");
      setMessage("Сеть подвела. Напишите в мессенджер — так точно дойдёт.");
    }
  }

  if (status === "ok") {
    return (
      <div className="flex flex-col items-start gap-3 py-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check size={22} weight="bold" /></span>
        <p className="text-lg font-medium">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="hidden" aria-hidden><input type="text" name="website" tabIndex={-1} autoComplete="off" /></div>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Куда написать: ВК, Telegram, MAX или телефон</label>
        <input name="telegram_or_email" required placeholder="@username, ссылка или номер" className="rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-[0.98rem] text-foreground outline-none transition-colors duration-300 placeholder:text-faint focus:border-accent/60 focus:bg-white/[0.06]" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Что за бизнес</label>
        <textarea name="project_summary" required minLength={20} rows={3} placeholder="Чем занимаетесь и где вас находят. Пара предложений — этого хватит." className="resize-none rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-[0.98rem] text-foreground outline-none transition-colors duration-300 placeholder:text-faint focus:border-accent/60 focus:bg-white/[0.06]" />
      </div>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[var(--accent)]" />
        <span>Согласен на обработку контакта и описания задачи для ответа по проекту.</span>
      </label>
      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button type="submit" disabled={status === "loading"} className="group inline-flex items-center gap-3 rounded-full bg-accent py-3.5 pl-6 pr-2 text-[0.95rem] font-semibold text-accent-foreground transition-all duration-300 active:scale-[0.98] disabled:opacity-60">
          <span>{status === "loading" ? "Отправляю…" : "Забрать бесплатный макет"}</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/15 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight size={17} weight="bold" /></span>
        </button>
        {status === "err" && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </form>
  );
}

function Wrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className ?? ""}`}>{children}</div>;
}

/* ── interactive floor plan demo: real hotspots over the generated plan ── */
const planSpots = [
  { x: 74, y: 46, title: "Зал у окна", sub: "8 столов · сегодня свободно", cta: "Забронировать" },
  { x: 37, y: 38, title: "Бар", sub: "Барная карта и посадка", cta: "Смотреть меню" },
  { x: 66, y: 82, title: "Летняя веранда", sub: "Открыта с мая", cta: "Выбрать стол" },
];

function FloorplanDemo() {
  const [active, setActive] = useState<number | null>(0);
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_40px_80px_-34px_rgba(0,0,0,0.85)]">
      <div className="relative overflow-hidden rounded-[calc(1.6rem-0.375rem)]">
        <Image src="/site/floorplan-demo.png" alt="Интерактивный план зала: кликабельные зоны с бронированием" width={1536} height={1024} sizes="(min-width: 1024px) 560px, 92vw" className="h-auto w-full select-none" />
        {planSpots.map((s, i) => (
          <div key={s.title} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
            <button
              type="button"
              aria-label={s.title}
              onClick={() => setActive(active === i ? null : i)}
              className="group relative -translate-x-1/2 -translate-y-1/2"
            >
              <span className="absolute -inset-2 animate-ping rounded-full border border-accent/50" />
              <span className={`relative flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-125 ${active === i ? "bg-accent" : "bg-accent/80"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-black/50" />
              </span>
            </button>
            {active === i && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: EASE }}
                className={`absolute z-10 w-44 rounded-xl border border-white/12 bg-background/95 p-3.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md ${s.x > 55 ? "right-4" : "left-4"} ${s.y > 60 ? "bottom-5" : "top-5"}`}
              >
                <p className="text-[0.88rem] font-semibold leading-tight">{s.title}</p>
                <p className="mt-1 text-[0.74rem] leading-snug text-muted-foreground">{s.sub}</p>
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[0.72rem] font-semibold text-accent-foreground">
                  {s.cta} <ArrowUpRight size={11} weight="bold" />
                </span>
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <p className="flex items-center gap-2 px-3 py-2.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-faint">
        <MapTrifold size={14} className="text-accent" /> Живой пример — потрогайте точки на плане
      </p>
    </div>
  );
}

export default function SitePresentationLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  return (
    <div ref={rootRef} data-site-root className="relative overflow-clip" id="top">
      <Grain />
      <TreasureRoute progress={scrollYProgress} />

      {/* soft accent glows, restrained */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-[8%] top-[2%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent),transparent_82%),transparent_62%)] blur-[70px]" />
        <div className="absolute left-[-10%] top-[130vh] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_62%)] blur-[70px]" />
      </div>

      {/* ── nav ── */}
      <nav className="fixed inset-x-0 top-5 z-50 mx-auto flex w-max items-center gap-2 rounded-full border border-white/10 bg-background/70 py-2 pl-5 pr-2 backdrop-blur-xl">
        <a href="#top" className="text-[1.02rem] font-bold tracking-tight">
          Айнур<span className="text-accent">.</span>
        </a>
        <a href="#zayavka" className="group ml-3 inline-flex items-center gap-2 rounded-full bg-accent py-2 pl-4 pr-2 text-sm font-semibold text-accent-foreground transition-transform duration-300 active:scale-95">
          Бесплатный макет
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight size={13} weight="bold" /></span>
        </a>
      </nav>

      {/* ── HERO (asymmetric split) ── */}
      <section className="relative">
        {/* large atmospheric hero background — the treasure-map route */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden">
          <Image src="/site/hero-site.png" alt="" fill priority sizes="100vw" className="object-cover object-[72%_center] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/65 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/35" />
        </div>
        <Wrap className="grid min-h-[92dvh] grid-cols-1 items-center gap-14 pb-14 pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28 lg:pl-20">
          <div className="flex flex-col items-start">
            <Reveal><Eyebrow>Сайты для малого и среднего бизнеса</Eyebrow></Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-7 text-[clamp(2.5rem,6vw,4.6rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
                Один сайт, который ведёт клиента{" "}
                <span className="relative whitespace-nowrap text-accent">
                  до кассы
                  <svg aria-hidden viewBox="0 0 200 12" className="absolute -bottom-1 left-0 w-full" fill="none"><path d="M2 8 C 50 2, 150 2, 198 7" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" /></svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mt-8 max-w-lg text-[1.05rem] leading-relaxed text-muted-foreground">
                Человек заходит — и сразу видит <span className="font-semibold text-foreground">цены, услуги, меню</span>. Тут же <span className="font-semibold text-foreground">выбирает и записывается</span> или заказывает доставку. А заявка падает <span className="font-semibold text-accent">вам в мессенджер</span> — не теряясь в директах и пропущенных.
              </p>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Magnetic href="#zayavka" variant="accent">Хочу бесплатный макет</Magnetic>
                <Magnetic href="#contour" variant="ghost">Как это работает</Magnetic>
              </div>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center gap-2.5">
                {[
                  { i: <Clock size={16} weight="duotone" />, t: "Готово за 5–7 дней" },
                  { i: <MagnifyingGlass size={16} weight="duotone" />, t: "Инфо соберу сам" },
                  { i: <BellRinging size={16} weight="duotone" />, t: "Заявки — куда удобно" },
                ].map((b) => (
                  <motion.div
                    key={b.t}
                    whileHover={{ y: -2 }}
                    transition={SPRING}
                    className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-3.5 backdrop-blur-sm transition-colors duration-300 hover:border-accent/30"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/20">{b.i}</span>
                    <span className="text-[0.8rem] font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground">{b.t}</span>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 -z-0 m-auto h-72 w-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent),transparent_70%),transparent_66%)] blur-3xl" />
            <motion.div
              initial={{ rotate: 2 }}
              animate={{ y: [0, -12, 0], rotate: [2, 0, 2] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-[18rem] rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_50px_90px_-30px_rgba(0,0,0,0.8)] sm:w-[22rem] lg:w-[24rem]"
            >
              <Image src="/site/example-cafe.png" alt="Пример сайта: кофейня" width={1024} height={1024} priority sizes="(min-width: 1024px) 384px, (min-width: 640px) 352px, 288px" className="h-auto w-full select-none rounded-[calc(2rem-0.375rem)]" />
            </motion.div>
          </Reveal>
        </Wrap>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" className="pb-20 pt-8 md:pb-28 md:pt-10 lg:pl-20">
        <Wrap>
          <Reveal><Eyebrow>Как сейчас</Eyebrow></Reveal>
          <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <Reveal delay={0.05}>
              <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-bold leading-[1.06] tracking-[-0.02em]">
                Вас находят в 2ГИС, ВК и на Яндекс.Картах. А дальше — либо звонят, либо едут.
              </h2>
              <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-muted-foreground">
                И <span className="font-semibold text-accent">часть клиентов теряется</span>: не поняли, что у вас есть, какие услуги и цены, как записаться — и ушли к тому, у кого <span className="font-semibold text-foreground">всё понятно с первого экрана</span>.
              </p>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="flex flex-col divide-y divide-white/8 rounded-2xl border border-white/8 bg-white/[0.02]">
                {[
                  { c: "2ГИС", t: "нашёл — но не понял, что вы можете" },
                  { c: "ВКонтакте", t: "написал в директ, ответили через день" },
                  { c: "Яндекс.Карты", t: "увидел телефон, звонить поленился" },
                ].map((r) => (
                  <div key={r.c} className="flex items-center gap-4 p-5">
                    <span className="flex h-9 shrink-0 items-center rounded-lg bg-white/5 px-3 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{r.c}</span>
                    <span className="text-[0.95rem] text-muted-foreground">{r.t}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-accent">
                  <ArrowRight size={15} weight="bold" /> Клиент уходит. Деньги — тоже.
                </div>
              </div>
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* ── INSIGHT ── */}
      <section className="border-y border-white/8 bg-white/[0.015] py-20 md:py-28 lg:pl-20">
        <Wrap>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-14">
            <div>
          <Reveal>
            <p className="max-w-2xl text-[clamp(1.6rem,3.6vw,2.8rem)] font-semibold leading-[1.12] tracking-[-0.02em]">
              Людям нужно <span className="text-accent">одно место</span>, где собрано всё — и где можно сразу действовать, не выходя со страницы.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex flex-wrap gap-2.5">
                {["Цены", "Меню", "Услуги", "Возможности"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-foreground/90">
                    <Check size={13} weight="bold" className="text-accent" />
                    {t}
                  </span>
                ))}
              </div>
              <ArrowRight size={20} weight="bold" className="hidden shrink-0 text-accent sm:block" />
              <div className="flex flex-wrap gap-2.5">
                {[
                  { i: <CalendarCheck size={15} weight="bold" />, t: "Записаться" },
                  { i: <ChatsCircle size={15} weight="bold" />, t: "Написать" },
                  { i: <BellRinging size={15} weight="bold" />, t: "Заказать" },
                ].map((o) => (
                  <span key={o.t} className="inline-flex items-center gap-2 rounded-full bg-accent/12 px-4 py-2 text-sm font-medium text-accent ring-1 ring-accent/25">
                    {o.i}
                    {o.t}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
            </div>
            <Reveal delay={0.15} className="relative flex justify-center lg:justify-end">
              <div aria-hidden className="absolute inset-0 m-auto h-56 w-56 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent),transparent_72%),transparent_66%)] blur-3xl" />
              <div className="relative w-full max-w-[23rem] overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_40px_80px_-34px_rgba(0,0,0,0.85)]">
                <Image src="/site/insight-oneplace.png" alt="Всё в одном месте: меню, цены, услуги и запись" width={1024} height={1024} sizes="(min-width: 1024px) 368px, 90vw" className="h-auto w-full rounded-[calc(1.6rem-0.375rem)]" />
              </div>
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* ── CONTOUR ── */}
      <section id="contour" className="py-20 md:py-28 lg:pl-20">
        <Wrap>
          <Reveal><Eyebrow>Что я закрываю</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 max-w-3xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em]">
              Собираю сайт, который закрывает <span className="text-accent">весь путь клиента</span> — на одной странице.
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 sm:grid-cols-2">
            {contour.map((it, i) => (
              <Reveal key={it.title} delay={(i % 2) * 0.08}>
                <div className="flex h-full items-start gap-4 bg-background p-7 transition-colors duration-500 hover:bg-white/[0.02]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/20">{it.icon}</span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-lg font-semibold leading-snug">{it.title}</h3>
                    <p className="text-[0.92rem] leading-relaxed text-muted-foreground">{it.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ── FULL CYCLE ── */}
      <section className="py-20 md:py-24 lg:pl-20">
        <Wrap>
          <Reveal><Eyebrow>Полный цикл</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em]">
              Клиент проходит весь путь сам — и вы это видите.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {cycle.map((c, i) => (
              <Reveal key={c.src} delay={i * 0.1}>
                <div className="group flex flex-col items-center gap-5">
                  <div className="relative w-full max-w-[15rem]">
                    <span className="absolute -left-2 -top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-accent font-mono text-sm font-bold text-accent-foreground shadow-[0_0_18px_color-mix(in_oklch,var(--accent),transparent_55%)]">{i + 1}</span>
                    <div className="overflow-hidden rounded-[1.5rem] shadow-[0_40px_70px_-34px_rgba(0,0,0,0.9)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5">
                      <Image src={c.src} alt={c.cap} width={1024} height={1536} sizes="240px" className="h-auto w-full" />
                    </div>
                  </div>
                  <p className="max-w-[14rem] text-center text-[0.9rem] leading-relaxed text-muted-foreground">{c.cap}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </section>

      {/* ── PROCESS (waypoints) ── */}
      <section id="how" className="pb-24 pt-12 md:pb-32 md:pt-16 lg:pl-20">
        <Wrap>
          <Reveal><Eyebrow>Как мы это сделаем</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 max-w-2xl text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em]">
              Пять шагов. Тяжёлое — на мне.
            </h2>
          </Reveal>
          <div className="relative mt-16">
            {/* the trail: a glowing route the steps sit on */}
            <div aria-hidden className="absolute left-[31px] top-6 bottom-24 w-[2px] bg-gradient-to-b from-accent via-accent/35 to-transparent md:left-[35px]" />
            <div className="flex flex-col gap-9 md:gap-11">
              {steps.map((s, i) => {
                const last = i === steps.length - 1;
                return (
                  <Reveal key={s.n} delay={i * 0.06}>
                    <div className="group relative flex items-start gap-5 sm:gap-7">
                      {/* milestone waypoint */}
                      <div className="relative z-10 shrink-0">
                        {last && <span aria-hidden className="absolute -inset-2 animate-ping rounded-[1.4rem] border border-accent/40" />}
                        <motion.div
                          initial={{ scale: 0.55, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true, margin: "-70px" }}
                          transition={{ ...SPRING, delay: i * 0.06 + 0.08 }}
                          className={`flex h-16 w-16 items-center justify-center rounded-2xl font-mono text-[1.05rem] font-bold md:h-[72px] md:w-[72px] ${
                            last
                              ? "bg-accent text-accent-foreground shadow-[0_0_28px_color-mix(in_oklch,var(--accent),transparent_42%)]"
                              : "border border-white/10 bg-background text-accent ring-1 ring-accent/20 transition-colors duration-500 group-hover:ring-accent/50"
                          }`}
                        >
                          {s.n}
                        </motion.div>
                      </div>
                      {/* content */}
                      <div className="flex flex-1 flex-col gap-2 pt-1.5">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${last ? "bg-accent/15 text-accent ring-1 ring-accent/30" : "bg-white/[0.05] text-muted-foreground ring-1 ring-white/10 transition-colors duration-500 group-hover:text-accent"}`}>{s.icon}</span>
                          <h3 className="text-xl font-semibold leading-snug md:text-[1.35rem]">{s.title}</h3>
                        </div>
                        <p className="max-w-xl pl-12 text-[0.95rem] leading-relaxed text-muted-foreground">{s.text}</p>
                        <span className="ml-12 mt-1 inline-flex w-max items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-accent">
                          <ArrowRight size={11} weight="bold" /> {s.out}
                        </span>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </Wrap>
      </section>

      {/* ── SCOPE ── */}
      <section id="more" className="border-y border-white/8 bg-white/[0.015] py-24 md:py-28 lg:pl-20">
        <Wrap>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <Reveal>
              <Eyebrow>Если захотите больше</Eyebrow>
              <h2 className="mt-6 text-[clamp(1.8rem,3.8vw,2.8rem)] font-bold leading-[1.06] tracking-[-0.02em]">Сайт — это база. Дальше подключаю автоматизацию.</h2>
              <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-muted-foreground">Когда сайт уже <span className="font-semibold text-foreground">приводит клиентов</span> — можно <span className="font-semibold text-accent">снять с вас и рутину</span>. По желанию и по мере роста.</p>
            </Reveal>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col divide-y divide-white/8 rounded-2xl border border-white/8">
                {scope.map((s, i) => (
                  <Reveal key={s.title} delay={i * 0.08}>
                    <div className="flex items-start gap-5 p-6 transition-colors duration-500 hover:bg-white/[0.02]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent ring-1 ring-accent/20">{s.icon}</span>
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold">{s.title}</h3>
                        <p className="text-[0.9rem] leading-relaxed text-muted-foreground">{s.text}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              {/* the wildcard: any routine, built to order */}
              <Reveal delay={0.24}>
                <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-accent/[0.06] p-6">
                  <div aria-hidden className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--accent),transparent_70%),transparent_65%)] blur-2xl" />
                  <div className="relative flex items-start gap-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-[0_0_18px_color-mix(in_oklch,var(--accent),transparent_55%)]"><Sparkle size={22} weight="fill" /></span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-lg font-semibold">Любая ваша рутина — <span className="text-accent">под ключ</span></h3>
                      <p className="text-[0.9rem] leading-relaxed text-muted-foreground">Опишите задачу, которую делаете руками каждый день, — соберу под неё решение: бот, интеграцию, автоотчёт. Уникальная сборка под ваш процесс, а не коробка.</p>
                      <a href="https://gabdra.pw" target="_blank" rel="noreferrer" className="mt-1 inline-flex w-max items-center gap-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-accent underline-offset-4 hover:underline">
                        Как я это делаю — gabdra.pw <ArrowUpRight size={13} weight="bold" />
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Wrap>
      </section>

      {/* ── EXAMPLES (horizontal scroll) ── */}
      <section id="works" className="py-20 md:py-28">
        <Wrap className="lg:pl-20">
          <Reveal><Eyebrow>Примеры под ниши</Eyebrow></Reveal>
          <Reveal delay={0.05}>
            <h2 className="mt-6 max-w-2xl text-[clamp(1.8rem,3.8vw,2.9rem)] font-bold leading-[1.06] tracking-[-0.02em]">Вот такие сайты собираю — под любое направление.</h2>
          </Reveal>
        </Wrap>
        <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-8 lg:px-[max(2rem,calc((100vw-72rem)/2+5rem))] [scrollbar-width:none]">
          {mockups.map((m) => (
            <div key={m.label} className="group w-[16rem] shrink-0 snap-start sm:w-[18rem]">
              <div className="overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-1.5">
                <Image src={m.src} alt={`Пример сайта: ${m.label}`} width={1024} height={1024} sizes="(min-width: 640px) 288px, 256px" className="h-auto w-full rounded-[calc(1.4rem-0.375rem)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
              </div>
              <div className="px-1.5 pt-4">
                <h3 className="text-lg font-semibold">{m.label}</h3>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-muted-foreground">{m.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── INTERACTIVE (bigger business) ── */}
      <section id="interactive" className="border-y border-white/8 bg-white/[0.015] py-20 md:py-28 lg:pl-20">
        <Wrap>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
            <Reveal>
              <Eyebrow>Если бизнес посложнее</Eyebrow>
              <h2 className="mt-6 text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.02em]">
                <span className="text-accent">Интерактивные сайты</span> — когда одной страницы мало.
              </h2>
              <p className="mt-5 max-w-lg text-[1rem] leading-relaxed text-muted-foreground">
                Ресторан на сто мест, торговый центр, производство с каталогом. Здесь клиент не просто читает — он <span className="font-semibold text-foreground">кликает по плану, выбирает, считает и бронирует</span> прямо на сайте.
              </p>
              <ul className="mt-7 flex flex-col gap-3">
                {[
                  "Кликабельные планы помещений — этажи, залы, столы, площади в аренду",
                  "Каталоги с фильтрами и конфигураторы под ваш продукт",
                  "Личный кабинет, оплата, документы",
                  "Интеграции: 1С, CRM, YClients, телефония",
                  "Админка — сами меняете цены, фото и наличие",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent ring-1 ring-accent/25"><Check size={12} weight="bold" /></span>
                    <span className="text-[0.95rem] leading-relaxed text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 max-w-lg text-[0.95rem] leading-relaxed text-muted-foreground">
                Цена — <span className="font-semibold text-foreground">по задаче</span>: называю фикс после короткого разговора, до старта. <span className="font-semibold text-accent">Как и всё у меня — без сюрпризов.</span>
              </p>
              <div className="mt-8">
                <Magnetic href="#zayavka" variant="ghost">Обсудить сложный проект</Magnetic>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <FloorplanDemo />
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* ── PRICE + FORM ── */}
      <section id="zayavka" className="py-24 md:py-32 lg:pl-20">
        <Wrap>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal>
              <Eyebrow>Цена и старт</Eyebrow>
              <div className="mt-7 flex flex-col gap-1.5">
                <span className="whitespace-nowrap text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-none tracking-[-0.03em]">10 000–15 000 ₽</span>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-faint">разово, за весь сайт</span>
              </div>
              <p className="mt-6 max-w-md text-[1rem] leading-relaxed text-muted-foreground">
                Точную цену называю сразу, до старта, — и <span className="font-semibold text-accent">дороже этого не будет</span>, это точно. <span className="font-semibold text-foreground">Никаких скрытых доплат.</span> Абонентка — только если сами захотите, отдельно и по желанию.
              </p>
              <ul className="mt-7 flex flex-col gap-3">
                {["Готовый сайт за 5–7 дней", "2 бесплатные правки после сдачи", "Поддержка лично — без тикетов и очередей"].map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check size={12} weight="bold" /></span>
                    <span className="text-[0.98rem] text-foreground/90">{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-7 md:p-9">
                <h3 className="text-[clamp(1.5rem,3.2vw,2.2rem)] font-bold leading-tight">Сначала — <span className="text-accent">бесплатный макет</span> за 1–2 дня</h3>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground">Оставьте контакт — соберу <span className="font-semibold text-foreground">черновой макет главной</span> под ваш бизнес и покажу. <span className="font-semibold text-accent">Конкретный пример, а не обещания.</span></p>
                <div className="mt-7"><LeadForm /></div>
                <p className="mt-5 text-xs leading-relaxed text-faint">Отправляя заявку, вы соглашаетесь на обработку персональных данных согласно <a href="/privacy" className="underline underline-offset-2">Политике</a>.</p>
              </div>
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* ── CONTACT + footer ── */}
      <section id="contact" className="pb-14 pt-4 lg:pl-20">
        <Wrap>
          <Reveal>
            <h2 className="text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">Напишите, где удобно.</h2>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground">Пара слов о том, чем занимаетесь и где вас находят, — отвечу и предложу, <span className="font-semibold text-foreground">как сайт вам поможет</span>. Готов <span className="font-semibold text-accent">подъехать лично</span>, если вы рядом.</p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {channels.map((ch) => (
                <a key={ch.label} href={ch.href} target={ch.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-500 hover:border-accent/40">
                  <span className="flex flex-col">
                    <span className="text-[0.95rem] font-semibold">{ch.label}</span>
                    <span className="font-mono text-[0.72rem] text-faint">{ch.note}</span>
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-accent transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    {ch.label === "Telegram" ? <TelegramLogo size={17} /> : <ArrowUpRight size={16} weight="bold" />}
                  </span>
                </a>
              ))}
            </div>
          </Reveal>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-8 font-mono text-[0.74rem] text-faint">
            <span>© 2026 Айнур Габдраупов · сайты под любые направления</span>
            <div className="flex gap-5">
              <a href="https://gabdra.pw" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">gabdra.pw</a>
              <a href="/privacy" className="transition-colors hover:text-foreground">Политика</a>
            </div>
          </div>
        </Wrap>
      </section>
    </div>
  );
}
