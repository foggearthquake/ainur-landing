"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Database,
  FilmSlate,
  FlowArrow,
  PaintBrush,
  PaperPlaneTilt,
  Path,
  Robot,
  TelegramLogo,
  Timer,
  Waveform,
  type Icon,
} from "@phosphor-icons/react";
import s from "./hub.module.css";

const TG = "https://t.me/foggearthquake_bot";
const SLIDE_MS = 8000;

type Slide = {
  key: "sites" | "ai" | "art";
  name: string;
  tagline: string;
  href: string;
  cta: string;
  accent: string;
  features: { Icon: Icon; title: string; text: string }[];
};

/* One story in three chapters — "an idea stops being only an idea":
   sites = one ribbon winding toward a single destination (the client's path to the order),
   ai = glass threads carrying light braided into one cable (data coming alive),
   art = liquid silk blooming like a flower (an idea turning into an image).
   Each chapter is a GPT start frame animated with Grok Imagine Video. */
const SLIDES: Slide[] = [
  {
    key: "sites",
    name: "Сайты",
    tagline: "Сайт, который ведёт клиента до кассы — за 5–7 дней",
    href: "https://site.gabdra.pw",
    cta: "Открыть «Сайты»",
    accent: "#c9ef3b",
    features: [
      { Icon: Path, title: "Весь путь клиента", text: "Цены, услуги, запись и заявка — на одной странице." },
      { Icon: Timer, title: "Запуск за 5–7 дней", text: "Информацию собираю сам — от вас почти ничего не нужно." },
      { Icon: PaperPlaneTilt, title: "Заявки в мессенджер", text: "Каждое обращение сразу прилетает в Telegram." },
    ],
  },
  {
    key: "ai",
    name: "AI-системы",
    tagline: "Боты, ассистенты и автоматизация на ваших данных",
    href: "https://ai.gabdra.pw",
    cta: "Открыть «AI-системы»",
    accent: "#58d6ff",
    features: [
      { Icon: Robot, title: "Боты и ассистенты", text: "Отвечают клиентам по вашим данным, а не выдумывают." },
      { Icon: Database, title: "RAG по документам", text: "Ответы по регламентам и каталогам — даже на 38 000 позиций." },
      { Icon: FlowArrow, title: "Автоматизация рутины", text: "Заявки, отчёты, напоминания и CRM — без ручной работы." },
    ],
  },
  {
    key: "art",
    name: "AI-креатив",
    tagline: "ИИ-видео, анимация и генерация под задачу",
    // https on this host is held by the VPS's VPN container (serves a google.com cert);
    // plain http until kukla moves to Vercel like the other two
    href: "http://kukla.gabdra.pw",
    cta: "Открыть «AI-креатив»",
    accent: "#ff8a5c",
    features: [
      { Icon: FilmSlate, title: "ИИ-видео и анимация", text: "Ролики и персонажи — от сценария до готового видео." },
      { Icon: PaintBrush, title: "Генерация визуала", text: "Обложки, персонажи и графика для сайтов и рекламы." },
      { Icon: Waveform, title: "Голос и звук", text: "Озвучка и голосовые решения вплоть до realtime." },
    ],
  },
];

const poster = (k: Slide["key"]) => `/hub/${k}.webp`;
const video = (k: Slide["key"]) => `/hub/${k}.mp4`;

/* Every chapter keeps its own looping clip; only the one on screen plays and the rest stay
   paused (cheap on phones). Clips cross-fade on change, posters cover the first load. */
function StoryBackground({ index }: { index: number }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [warm, setWarm] = useState(false); // fetch the other clips once the first one runs

  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [index]);

  return (
    <div className={s.bg} aria-hidden>
      {SLIDES.map((sl, i) => (
        <video
          key={sl.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={s.bgVideo}
          style={{ opacity: i === index ? 1 : 0 }}
          src={video(sl.key)}
          poster={poster(sl.key)}
          muted
          loop
          playsInline
          autoPlay={i === 0}
          preload={i === index || warm ? "auto" : "none"}
          onPlaying={() => setWarm(true)}
        />
      ))}
      <div className={s.bgShade} />
    </div>
  );
}

export default function HubLanding() {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const [paused, setPaused] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((i: number) => {
    setIndex((i + SLIDES.length) % SLIDES.length);
    setCycle((c) => c + 1);
  }, []);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  // stories: swipe to change, press-and-hold to pause
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    drag.current = { x: e.clientX, y: e.clientY };
    setPaused(true);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setPaused(false);
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? next : prev)();
  };

  const slide = SLIDES[index];

  return (
    <main className={s.root}>
      <section
        className={s.hero}
        style={{ "--accent": slide.accent } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
          setPaused(false);
        }}
      >
        <StoryBackground index={index} />

        <header className={s.nav}>
          <a href="/" className={s.logo}>
            ainur<span>.</span>
          </a>
          <a href={TG} target="_blank" rel="noreferrer" className={s.navCta}>
            <TelegramLogo size={16} weight="fill" /> Написать
          </a>
        </header>

        <div className={s.stage} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {/* initial={false}: the first slide is server-rendered already visible (headline in the
              HTML for SEO / first paint); only slide changes animate */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.key}
              className={s.slide}
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className={s.title}>
                <span className={s.titleBrand}>ainur</span> <span className={s.titleName}>{slide.name}</span>
              </h1>

              <div className={s.tray}>
                {slide.features.map(({ Icon, title, text }) => (
                  <div key={title} className={s.feature}>
                    <span className={s.featureIcon} aria-hidden>
                      <Icon size={34} weight="light" />
                      <i className={s.featureDot} />
                    </span>
                    <span className={s.featureTitle}>{title}</span>
                    <span className={s.featureText}>{text}</span>
                  </div>
                ))}
              </div>

              <p className={s.tagline}>{slide.tagline}</p>
              <div className={s.ctas}>
                <a href={slide.href} className={s.ctaMain}>
                  {slide.cta} <ArrowUpRight size={16} weight="bold" />
                </a>
                <a href={TG} target="_blank" rel="noreferrer" className={s.ctaGhost}>
                  Написать в Telegram
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={s.pills} role="tablist" aria-label="Направления">
          {SLIDES.map((sl, i) => (
            <button
              key={sl.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Показать «${sl.name}»`}
              className={s.pill}
              onClick={() => go(i)}
            >
              {i === index ? (
                <i
                  key={cycle}
                  className={s.pillFill}
                  style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                  onAnimationEnd={next}
                />
              ) : (
                i < index && <i className={s.pillDone} />
              )}
            </button>
          ))}
        </div>
      </section>

      <section className={s.dirs} aria-labelledby="dirs-title">
        <h2 id="dirs-title" className={s.dirsTitle}>
          Три направления
        </h2>
        <p className={s.dirsSub}>Каждое — отдельный сайт. Выберите, с чего начать.</p>
        <div className={s.cards}>
          {SLIDES.map((sl) => (
            <a
              key={sl.key}
              href={sl.href}
              className={s.card}
              style={{ "--accent": sl.accent } as CSSProperties}
              onMouseEnter={(e) => e.currentTarget.querySelector("video")?.play().catch(() => {})}
              onMouseLeave={(e) => e.currentTarget.querySelector("video")?.pause()}
            >
              <span className={s.cardMedia}>
                <video src={video(sl.key)} poster={`/hub/${sl.key}-card.webp`} muted loop playsInline preload="none" />
                <span className={s.cardName}>
                  <em>ainur</em>
                  {sl.name}
                </span>
              </span>
              <span className={s.cardFoot}>
                <span>{sl.tagline}</span>
                <span className={s.cardArrow} aria-hidden>
                  <ArrowUpRight size={16} weight="bold" />
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <footer className={s.foot}>
        <span>© 2026 ainur.</span>
        <a href={TG} target="_blank" rel="noreferrer">
          Telegram
        </a>
        <a href="mailto:ainur@gabdra.pw">ainur@gabdra.pw</a>
        <a href="/privacy">Политика</a>
      </footer>
    </main>
  );
}
