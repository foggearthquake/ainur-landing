"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { TelegramLogo } from "@phosphor-icons/react";
import s from "./hub.module.css";

const TG = "https://t.me/foggearthquake_bot";
const SLIDE_MS = 8000;
const PORTRAIT = "(max-aspect-ratio: 3/4)";

type Key = "sites" | "ai" | "art";

/* One world for all three stories — "fog over a still plane" — each in its own colour.
   The background is a slow ambient loop; the card in the middle carries the idea,
   and everything that has to be read (requests, code) is drawn by code, not generated. */
const SLIDES: { key: Key; name: string; sub: string; href: string | null }[] = [
  { key: "sites", name: "Сайты", sub: "Сайт, который ведёт клиента от первого клика до заявки", href: "https://site.gabdra.pw" },
  { key: "ai", name: "AI-системы", sub: "Ассистенты и автоматизация, которые работают на ваших данных", href: "https://ai.gabdra.pw" },
  // kukla.gabdra.pw is not shown yet: the story stays, the button leads nowhere
  { key: "art", name: "AI-креатив", sub: "Видео, анимация и визуал — от идеи до готового кадра", href: null },
];

const asset = (name: string, ext: string) => `/hub/v2/${name}.${ext}`;

/* ── background: a looping clip per story, landscape or 9:16 by screen shape ── */
function Backdrop({ index, portrait }: { index: number; portrait: boolean | null }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [warm, setWarm] = useState(false); // fetch the other clips once the first one runs

  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) v.play().catch(() => {});
      else v.pause();
    });
  }, [index, portrait]);

  return (
    <div className={s.bg} aria-hidden>
      {SLIDES.map((sl, i) => (
        <div
          key={sl.key}
          className={s.bgLayer}
          style={
            {
              opacity: i === index ? 1 : 0,
              "--land": `url(${asset(`bg-${sl.key}-land`, "webp")})`,
              "--port": `url(${asset(`bg-${sl.key}-port`, "webp")})`,
            } as CSSProperties
          }
        >
          {/* posters paint the first screen from CSS; the clip is chosen once the screen shape is known */}
          {portrait !== null && (
            <video
              ref={(el) => {
                refs.current[i] = el;
              }}
              className={s.bgVideo}
              src={asset(`bg-${sl.key}-${portrait ? "port" : "land"}`, "mp4")}
              muted
              loop
              playsInline
              autoPlay={i === index}
              preload={i === index || warm ? "auto" : "none"}
              onPlaying={() => setWarm(true)}
            />
          )}
        </div>
      ))}
      <div className={s.bgShade} />
    </div>
  );
}

/* ── Сайты: requests fly in from every side and sink into the point of light ── */
const TOASTS = [
  { t: "Новая заявка", d: "Анна · стрижка, завтра 15:00" },
  { t: "Бронь столика", d: "4 гостя · сегодня 19:30" },
  { t: "Запись на диагностику", d: "Kia Rio · завтра 10:00" },
  { t: "Заказ с доставкой", d: "2 480 ₽ · оплачен онлайн" },
  { t: "Заявка с сайта", d: "Ремонт кухни · перезвонить" },
  { t: "Запись к стоматологу", d: "Игорь · пятница 12:00" },
];
// around the light point (percent of the card); each one arrives from its own side
const SLOTS = [
  { x: 5, y: 10, from: -70 },
  { x: 57, y: 16, from: 70 },
  { x: 9, y: 66, from: -70 },
  { x: 55, y: 70, from: 70 },
];

function SitesToasts() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((v) => v + 1), 1400);
    return () => window.clearInterval(id);
  }, []);
  const live = [n - 2, n - 1, n].filter((i) => i >= 0); // three on screen at most

  return (
    <div className={s.overlay} aria-hidden>
      <AnimatePresence>
        {live.map((i) => {
          const slot = SLOTS[i % SLOTS.length];
          const it = TOASTS[i % TOASTS.length];
          return (
            <motion.div
              key={i}
              className={s.toast}
              initial={{ opacity: 0, x: slot.from, y: 0, left: `${slot.x}%`, top: `${slot.y}%`, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
              exit={{
                opacity: 0,
                left: "50%",
                top: "50%",
                x: "-50%",
                y: "-50%",
                scale: 0.2,
                transition: { duration: 0.9, ease: [0.55, 0, 0.75, 0.2] },
              }}
            >
              <i className={s.toastDot} />
              <b>{it.t}</b>
              <span>{it.d}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ── AI-системы: a line of code written by light along the horizon, mirrored in the plane ── */
const CODE: [string, string][] = [
  ['ask("Когда свободна запись?")', '→ "Завтра в 10:00 и 15:30. Записать вас?"'],
  ['find(catalog, "фланец ДУ-50")', "→ 3 позиции · на складе 120 шт"],
  ["report.daily()", "→ 14 заявок · 86 400 ₽ · отправлено в Telegram"],
];
const CHAR_S = 0.045;

function LightLine({ text, delay }: { text: string; delay: number }) {
  const d = Math.max(0.8, text.length * CHAR_S);
  return (
    <span className={s.codeLine}>
      <motion.span
        className={s.codeText}
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: d, delay, ease: "linear" }}
      >
        {text}
      </motion.span>
      <motion.i
        className={s.pen}
        initial={{ left: "0%", opacity: 0 }}
        animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
        transition={{ duration: d, delay, ease: "linear", opacity: { duration: d, delay, times: [0, 0.05, 0.9, 1] } }}
      />
    </span>
  );
}

function CodeLight() {
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setK((v) => (v + 1) % CODE.length), 6400);
    return () => window.clearInterval(id);
  }, []);
  const [a, b] = CODE[k];
  const second = Math.max(0.8, a.length * CHAR_S) + 0.25;
  const block = (
    <>
      <LightLine text={a} delay={0.2} />
      <LightLine text={b} delay={0.2 + second} />
    </>
  );

  return (
    <div className={s.overlay} aria-hidden>
      <AnimatePresence mode="wait">
        <motion.div key={k} exit={{ opacity: 0, filter: "blur(6px)" }} transition={{ duration: 0.5 }}>
          <div className={s.code}>{block}</div>
          <div className={`${s.code} ${s.codeReflection}`}>{block}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── the card: clips cross-fade, the active story's overlay runs on top ── */
function Card({ index }: { index: number }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [warm, setWarm] = useState(false);
  const key = SLIDES[index].key;

  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === index) v.play().catch(() => {});
      else v.pause();
    });
  }, [index]);

  return (
    <div className={s.cardFrame}>
      <div className={s.card}>
        {SLIDES.map((sl, i) => (
          <video
            key={sl.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            // AI-креатив: one endless flight toward the horizon; the world changes colour in code
            className={`${s.cardVideo} ${sl.key === "art" ? s.worlds : ""}`}
            style={{ opacity: i === index ? 1 : 0 }}
            src={asset(`card-${sl.key}`, "mp4")}
            poster={asset(`card-${sl.key}`, "webp")}
            muted
            loop
            playsInline
            autoPlay={i === 0}
            preload={i === 0 || warm ? "auto" : "none"}
            onPlaying={() => setWarm(true)}
          />
        ))}
        {key === "sites" && <SitesToasts key="sites" />}
        {key === "ai" && <CodeLight key="ai" />}
      </div>
    </div>
  );
}

export default function HubLanding() {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const [paused, setPaused] = useState(false);
  const [portrait, setPortrait] = useState<boolean | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(PORTRAIT);
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
  const fade = {
    initial: { opacity: 0, y: 14, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: -10, filter: "blur(6px)" },
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <main
      className={s.root}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        drag.current = null;
        setPaused(false);
      }}
    >
      <Backdrop index={index} portrait={portrait} />

      <header className={s.nav}>
        <Link href="/" className={s.logo}>
          ainur.
        </Link>
        <a href={TG} target="_blank" rel="noreferrer" className={s.navCta}>
          <TelegramLogo size={16} weight="fill" /> Написать
        </a>
      </header>

      <section className={s.stage} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {/* initial={false}: the first slide is server-rendered already visible; only changes animate */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1 key={slide.key} className={s.title} {...fade}>
            ainur {slide.name}
          </motion.h1>
        </AnimatePresence>

        <Card index={index} />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={slide.key} className={s.copy} {...fade}>
            <p className={s.sub}>{slide.sub}</p>
            <div className={s.ctas}>
              {slide.href ? (
                <a href={slide.href} className={s.btn}>
                  Открыть
                </a>
              ) : (
                <span className={`${s.btn} ${s.btnOff}`} aria-disabled="true">
                  Скоро
                </span>
              )}
              <a href={TG} target="_blank" rel="noreferrer" className={s.btn}>
                Telegram
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

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

      <footer className={s.foot}>
        <span>© 2026 ainur.</span>
        <Link href="/privacy">Политика</Link>
      </footer>
    </main>
  );
}
