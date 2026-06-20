"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  NeuroBand,
  IconBot,
  IconDoc,
  IconGear,
  IconMic,
  IconPlatform,
  IconSpark,
} from "./Graphics";
import LeadForm from "@/app/LeadForm";
import Clock from "../minimal-v1/Clock";
import styles from "./ink-swarm.module.css";

// three.js is heavy and purely decorative — load it after the shell paints
const Swarm = dynamic(() => import("./Swarm"), { ssr: false });

type Case = {
  name: string;
  category: string;
  description: string;
  result: string;
  tags: string[];
  link?: { label: string; href: string };
};

const cases: Case[] = [
  {
    name: "Tender Copilot",
    category: "Telegram · RAG",
    description:
      "Загружаешь тендерный PDF или DOCX — за 15–20 минут получаешь решение GO / REVIEW / NO_GO с цитатами из документа и черновиком заявки. Вместо часов чтения.",
    result:
      "На внутреннем тест-сете: верное решение в 100% случаев, каждое утверждение подкреплено цитатой. Принцип простой — нет цитаты, нет утверждения.",
    tags: ["Python", "Aiogram", "pgvector", "Celery", "OCR"],
    link: { label: "github.com/foggearthquake/tender-copilot-telegram-rag", href: "https://github.com/foggearthquake/tender-copilot-telegram-rag" },
  },
  {
    name: "AI Campaign",
    category: "SaaS · Multi-agent",
    description:
      "Маркетинговый SaaS: берёт сайт компании и до 10 источников, собирает базу знаний о бренде и готовит материалы под несколько каналов — в одном окне.",
    result:
      "Рабочий MVP. Победитель гранта Фонда содействия инновациям — 1 млн ₽ на 12 месяцев. Есть индивидуальный заказ под клиента.",
    tags: ["FastAPI", "Next.js", "Celery", "RAG", "Multi-tenant"],
    link: { label: "github.com/foggearthquake/ai-marketing-campaign-generator", href: "https://github.com/foggearthquake/ai-marketing-campaign-generator" },
  },
  {
    name: "КП из каталога на 38 000 позиций",
    category: "Industry · RAG",
    description:
      "Чат-бот собирает коммерческое предложение из промышленного каталога на ~38 000 позиций: в диалоге уточняет тип, типоразмер, давление, материал — и подбирает позиции с артикулами.",
    result:
      "Сборка КП — с примерно рабочего дня до ~30 минут. Бот ещё и подсказывает, какое исполнение лучше под задачу, а не просто ищет по артикулу.",
    tags: ["Python", "RAG", "pgvector", "LLM"],
  },
  {
    name: "AI-квалификация лидов",
    category: "Agent · CRM",
    description:
      "Бот общается со входящими без кнопочных скриптов, оценивает теплоту лида от 0 до 100 и передаёт менеджеру готовое summary. Отвечает строго по базе знаний клиента, без выдумок по ценам.",
    result:
      "Горячие заявки не остывают в очереди, менеджер получает уже квалифицированный лид. Веса и триггеры — конфиг под клиента, не код.",
    tags: ["Python", "Aiogram", "pgvector", "Bitrix24"],
    link: { label: "github.com/foggearthquake/universal-AI-agent-sells", href: "https://github.com/foggearthquake/universal-AI-agent-sells" },
  },
  {
    name: "ИИ-ведущий радио «ВИКА»",
    category: "Voice · Realtime",
    description:
      "Голосовой AI-ведущий для радио: каскад STT → LLM → TTS, память эфира на три уровня, свежие новости по кнопке и защита от провокаций.",
    result:
      "Прогон на живом эфире региональной FM-станции пройден: держал контекст, отработал фактчек веб-поиском, отбил провокацию на политику стоп-фразой.",
    tags: ["Python", "Claude", "ElevenLabs", "Qdrant", "Tavily"],
    link: { label: "github.com/foggearthquake/ai-radio-host", href: "https://github.com/foggearthquake/ai-radio-host" },
  },
];

type Panel = "about" | "solutions" | null;

const solutions = [
  {
    icon: <IconBot />,
    title: "Бот, который отвечает за тебя",
    text: "Заявки, поддержка, диалог по твоей базе знаний. Без выходных и без «оператор скоро ответит».",
  },
  {
    icon: <IconDoc />,
    title: "Бот, который читает за тебя",
    text: "Роется в документах, таблицах, каталогах: находит нужное, подбирает, сверяет, готовит черновик за секунды.",
  },
  {
    icon: <IconGear />,
    title: "Автоматизация рутины",
    text: "Сервисы связаны между собой. Отчёты, выгрузки и рассылки уходят сами, данные никто не переносит руками.",
  },
  {
    icon: <IconMic />,
    title: "Голос",
    text: "Звонки, прямой эфир, озвучка. Говорит живо и по делу, держит контекст разговора.",
  },
  {
    icon: <IconPlatform />,
    title: "Продукт целиком",
    text: "Личный кабинет, дашборды, своя платформа под нишу. От первого экрана до рабочего сервиса.",
  },
  {
    icon: <IconSpark />,
    title: "Любая идея",
    text: "Нет в списке выше? Опиши задачу своими словами - придумаю, как закрыть её кодом.",
  },
];

export default function InkSwarmLanding() {
  const hotspotsRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [hover, setHover] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    let raf = 0;
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const vh = window.innerHeight || 800;
        const y = window.scrollY || 0;
        if (hotspotsRef.current) {
          const ho = clamp01(1 - y / (vh * 0.2));
          hotspotsRef.current.style.opacity = String(ho);
          hotspotsRef.current.classList.toggle(styles.hotspotsOff, ho <= 0.05);
        }
        if (hintRef.current) hintRef.current.style.opacity = String(clamp01(1 - y / (vh * 0.16)));
        if (backdropRef.current) backdropRef.current.style.opacity = String(clamp01(1 - (y - vh * 0.5) / (vh * 0.55)));
        if (headerRef.current) headerRef.current.classList.toggle(styles.headerHero, y < vh * 0.5);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // lock the page + wire Esc while a panel is open
  useEffect(() => {
    if (!panel) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const openPanel = (p: Exclude<Panel, null>) => {
    window.scrollTo({ top: 0 });
    setHover(null);
    setPanel(p);
  };

  const toTop = (e?: React.MouseEvent) => {
    e?.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <div className={styles.heroBackdrop} ref={backdropRef} aria-hidden="true" />
      <Swarm hovered={hover} dispersed={panel !== null} />

      <header className={styles.header} ref={headerRef}>
        <div className={styles.headerInner}>
          <a className={styles.brand} href="#top" onClick={toTop}>
            <span className={styles.brandWord}>
              ainur<span className={styles.dot}>.</span>
            </span>
          </a>
          <button className={styles.toHero} onClick={toTop} aria-label="Наверх">
            ↑ начало
          </button>
        </div>
      </header>

      {/* Hero — the glowing cube lives in the fixed canvas; these are its two
          clickable halves. Left = "Обо мне" (cyan), right = "Решения" (green). */}
      <div className={styles.hero} id="top">
        <div className={styles.hotspots} ref={hotspotsRef}>
          <button
            type="button"
            className={`${styles.hotspot} ${styles.hotLeft}`}
            onMouseEnter={() => setHover("left")}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => {
              e.currentTarget.blur();
              openPanel("about");
            }}
          >
            <span className={styles.hotLabel}>Обо мне</span>
          </button>
          <button
            type="button"
            className={`${styles.hotspot} ${styles.hotRight}`}
            onMouseEnter={() => setHover("right")}
            onMouseLeave={() => setHover(null)}
            onClick={(e) => {
              e.currentTarget.blur();
              openPanel("solutions");
            }}
          >
            <span className={styles.hotLabel}>Решения</span>
            <span className={styles.hotSub}>что возможно</span>
          </button>
        </div>
        <div className={styles.scrollHint} ref={hintRef}>
          листай ↓
        </div>
      </div>

      <main className={styles.content}>
        <div className={styles.wrap}>
          <section className={styles.section} id="works">
            <div className={styles.label}>Работы</div>
            <p className={styles.worksLine}>
              ~13 лендингов · ~17 ботов и ассистентов · 4 RAG-проекта · грант ФСИ 1 млн ₽
            </p>
            <div className={styles.cases}>
              {cases.map((c) => (
                <details className={styles.case} key={c.name}>
                  <summary>
                    <span className={styles.pm} aria-hidden="true" />
                    <span className={styles.caseName}>{c.name}</span>
                    <span className={styles.caseCat}>{c.category}</span>
                  </summary>
                  <div className={styles.caseBody}>
                    <p>{c.description}</p>
                    <p className={styles.caseResult}>{c.result}</p>
                    <div className={styles.tags}>
                      {c.tags.map((t) => (
                        <span className={styles.tag} key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                    {c.link ? (
                      <a className={styles.caseLink} href={c.link.href} target="_blank" rel="noreferrer">
                        {c.link.label}
                      </a>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className={styles.section} id="contact">
            <div className={styles.label}>Контакт</div>
            <h2 className={styles.contactLead}>Расскажи про задачу.</h2>
            <p className={styles.contactText}>Она может быть любая, если связана с цифровыми решениями.</p>
            <div className={styles.contactLinks}>
              <a href="https://t.me/foggearthquake_bot" target="_blank" rel="noreferrer">
                @foggearthquake_bot
              </a>
              <a href="mailto:foggearthquake@gmail.com">foggearthquake@gmail.com</a>
              <a href="https://github.com/foggearthquake" target="_blank" rel="noreferrer">
                github.com/foggearthquake
              </a>
            </div>
            <div className={styles.formCard}>
              <LeadForm />
              <p className={styles.privacy}>
                Отправляя заявку, вы даёте согласие на обработку персональных данных в соответствии с{" "}
                <a href="/privacy">Политикой конфиденциальности</a>.
              </p>
            </div>
          </section>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerMeta}>
              <span>© 2026 Айнур Габдраупов</span>
              <span>·</span>
              <span>Москва</span>
              <span>·</span>
              <span>Уфа</span>
              <span>·</span>
              <Clock />
            </div>
            <div className={styles.footerLinks}>
              <a href="https://github.com/foggearthquake" target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href="https://t.me/foggearthquake_bot" target="_blank" rel="noreferrer">
                Telegram
              </a>
              <a href="/privacy">Политика</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Click a cube half -> the cube bursts apart and a glass panel fades in */}
      {panel ? (
        <div className={styles.panelOverlay} onClick={() => setPanel(null)}>
          <div
            className={`${styles.panel} ${panel === "about" ? styles.panelAbout : styles.panelSolutions}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className={styles.panelClose} onClick={() => setPanel(null)} aria-label="Закрыть">
              ×
            </button>
            {panel === "about" ? (
              <>
                <div className={styles.panelHead}>
                  <img className={styles.avatar} src="/ainur-avatar.jpeg" alt="Айнур Габдраупов" />
                  <div>
                    <div className={styles.panelKicker}>Обо мне</div>
                    <h2 className={styles.panelTitle}>Айнур Габдраупов</h2>
                  </div>
                </div>
                <p>
                  В прошлом - инженер-технолог в нефтегазе. Привычка осталась: считаю заранее и
                  собираю так, чтобы держало нагрузку и работало спустя год.
                </p>
                <p>
                  Последние два года - в цифре. Сейчас делаю AI-разработку и автоматизацию сам,
                  руками: идея, код, рабочий продукт. Инженерное чутьё подсказывает, что реально
                  собрать за разумные деньги, а что останется красивым слайдом.
                </p>
              </>
            ) : (
              <>
                <NeuroBand />
                <div className={styles.panelKicker}>Какие диджитал-решения возможны</div>
                <h2 className={styles.panelTitle}>От бота до платформы</h2>
                <p className={styles.solLead}>
                  Снимаю с людей рутину. Масштаб любой - один бот или целая платформа.
                </p>
                <ul className={styles.solList}>
                  {solutions.map((s) => (
                    <li className={styles.solItem} key={s.title}>
                      <span className={styles.solIconWrap}>{s.icon}</span>
                      <span className={styles.solBody}>
                        <span className={styles.solTitle}>{s.title}</span>
                        <span className={styles.solText}>{s.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={styles.solClose}>
                  Повторяется и описывается словами - значит, можно отдать машине. Расскажи свой
                  процесс, покажу как.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
