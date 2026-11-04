"use client";

import { useEffect, useState, type MutableRefObject, type RefObject } from "react";
import styles from "./ink-swarm.module.css";

/* HTML-слой 3D-схемы Клиент → ИИ → CRM → Вы. Узлы и пакеты рисует Swarm (three.js), он же двигает
   кнопки узлов за проекцией 3D-узлов и проявляет слой по прокрутке. Здесь — подписи, журнал заявки
   и описание выбранного узла. Пакеты и строки журнала идут по общим часам PIPE, поэтому не расходятся. */

export const PIPE = {
  T: 6, // цикл одной заявки, с
  seg: [
    [0, 0.9],
    [1.5, 2.4],
    [2.7, 3.6],
  ] as const, // пакет бежит по связи k
  hit: [0, 0.9, 2.4, 3.6] as const, // пакет у узла k — вспышка и строка журнала
  fade: 5.5, // журнал гаснет перед новым циклом
};
export const pipeClock = () => performance.now() / 1000;

export const NODES = [
  {
    name: "Клиент",
    sub: "Telegram · WhatsApp · VK",
    title: "Пишет как удобно",
    text: "Текстом или голосовым, ночью или в выходной. Не нужно звонить и ждать, пока ответит администратор.",
  },
  {
    name: "ИИ",
    sub: "по вашей базе знаний",
    title: "Понимает и отвечает",
    text: "Разбирает, чего хочет человек: записаться, перенести, узнать цену. Отвечает по прайсу и расписанию бизнеса, а не из головы нейросети, и сам записывает на свободное время.",
  },
  {
    name: "CRM",
    sub: "Bitrix24 · amo · таблица",
    title: "Заявка оформлена сама",
    text: "Имя, контакт, суть и оценка теплоты лида ложатся в CRM или таблицу. Данные никто не переносит руками, ничего не теряется.",
  },
  {
    name: "Вы",
    sub: "или менеджер",
    title: "Получаете готовое",
    text: "Короткое summary в Telegram. Жалоба, сложный вопрос или «позовите человека» — диалог сразу уходит вам.",
  },
] as const;

// по строке на узел — появляются, когда пакет доходит до узла
const SCENARIOS = [
  [
    "«Можно к стоматологу на завтра?»",
    "свободно 15:00 и 17:30 — записал на 15:00",
    "запись: завтра 15:00, осмотр",
    "новая запись, напоминание уйдёт само",
  ],
  [
    "«Сколько стоит чистка зубов?»",
    "3 500 ₽ по прайсу, предложил время",
    "лид: чистка, тёплый 72/100",
    "тёплый лид, клиенту уже ответили",
  ],
  [
    "«Позовите администратора»",
    "понял, передаю человеку",
    "обращение, приоритет высокий",
    "клиент просит человека — диалог у вас",
  ],
];

type Props = {
  layerRef: RefObject<HTMLDivElement | null>;
  nodeRefs: MutableRefObject<(HTMLButtonElement | null)[]>;
  active: number;
  onActive: (i: number) => void;
};

export default function Pipeline({ layerRef, nodeRefs, active, onActive }: Props) {
  const [tick, setTick] = useState({ cycle: 0, step: 4 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // журнал стоит целиком
    const id = window.setInterval(() => {
      const t = pipeClock();
      const ph = t % PIPE.T;
      const cycle = Math.floor(t / PIPE.T);
      const step = ph >= PIPE.fade ? 0 : PIPE.hit.filter((h) => ph >= h).length;
      setTick((p) => (p.cycle === cycle && p.step === step ? p : { cycle, step }));
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const lines = SCENARIOS[tick.cycle % SCENARIOS.length];
  const node = NODES[active];

  return (
    <div className={styles.flowLayer} ref={layerRef}>
      <div className={styles.flowHead}>
        <div className={styles.flowLabel}>Как это работает</div>
        <h2 className={styles.flowTitle}>Заявка проходит путь сама.</h2>
        <p className={styles.flowText}>
          Клиент пишет, ИИ отвечает и оформляет заявку, CRM её хранит, вам приходит готовое. Нажми на узел — покажу,
          что он делает.
        </p>
      </div>

      {NODES.map((n, i) => (
        <button
          type="button"
          key={n.name}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          className={`${styles.flowNode} ${active === i ? styles.flowNodeOn : ""}`}
          onClick={() => onActive(i)}
          aria-pressed={active === i}
        >
          <span className={styles.flowHit} aria-hidden="true" />
          <span className={styles.flowMeta}>
            <span className={styles.flowName}>{n.name}</span>
            <span className={styles.flowSub}>{n.sub}</span>
            <span className={`${styles.flowLine} ${tick.step > i ? styles.flowLineOn : ""}`} aria-hidden="true">
              {lines[i]}
            </span>
          </span>
        </button>
      ))}

      <div className={styles.flowInfo}>
        <div className={styles.flowInfoHead}>
          <span className={styles.flowNum}>{String(active + 1).padStart(2, "0")}</span>
          <span className={styles.flowInfoTitle}>{node.title}</span>
        </div>
        <p>{node.text}</p>
        <a className={styles.flowCta} href="#demo">
          Проверить на демо-боте ↓
        </a>
      </div>
    </div>
  );
}
