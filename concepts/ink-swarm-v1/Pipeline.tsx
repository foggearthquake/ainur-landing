"use client";

import { useState } from "react";
import styles from "./ink-swarm.module.css";

/* Живая схема автоматизации: один цикл = одна заявка проходит Клиент → ИИ → CRM → Вы.
   Пакеты и вспышки узлов — CSS-анимации с общим периодом 6 с, сценарий журнала
   меняется по событию конца цикла первого пакета, поэтому журнал и пакеты не расходятся. */

const NODES = [
  {
    key: "client",
    name: "Клиент",
    sub: "Telegram · WhatsApp · VK",
    title: "Пишет как удобно",
    text: "Текстом или голосовым, ночью или в выходной. Не нужно звонить и ждать, пока ответит администратор.",
  },
  {
    key: "ai",
    name: "ИИ",
    sub: "по вашей базе знаний",
    title: "Понимает и отвечает",
    text: "Разбирает, чего хочет человек: записаться, перенести, узнать цену. Отвечает по прайсу и расписанию бизнеса, а не из головы нейросети, и сам записывает на свободное время.",
  },
  {
    key: "crm",
    name: "CRM",
    sub: "Bitrix24 · amo · таблица",
    title: "Заявка оформлена сама",
    text: "Имя, контакт, суть и оценка теплоты лида ложатся в CRM или таблицу. Данные никто не переносит руками, ничего не теряется.",
  },
  {
    key: "owner",
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
    "новая запись, напоминание клиенту уйдёт само",
  ],
  [
    "«Сколько стоит чистка зубов?»",
    "3 500 ₽ по прайсу, предложил время",
    "лид: интерес — чистка, тёплый 72/100",
    "тёплый лид, ответ клиенту уже отправлен",
  ],
  [
    "«Позовите администратора»",
    "понял, передаю человеку",
    "обращение, приоритет высокий",
    "клиент просит человека — диалог у вас",
  ],
];

export default function Pipeline() {
  const [active, setActive] = useState(1);
  const [cycle, setCycle] = useState(0);
  const lines = SCENARIOS[cycle % SCENARIOS.length];
  const node = NODES[active];

  return (
    <div className={styles.pipe}>
      <div className={styles.pipeRow}>
        {NODES.map((n, i) => (
          <div className={styles.pipeCell} key={n.key}>
            {i > 0 ? (
              <span className={styles.pipeTrack} aria-hidden="true">
                <span
                  className={`${styles.pipePacket} ${styles[`pipeSeg${i}`]} ${i > 1 ? styles.pipeLead : ""}`}
                  onAnimationIteration={i === 1 ? () => setCycle((c) => c + 1) : undefined}
                />
              </span>
            ) : null}
            <button
              type="button"
              className={`${styles.pipeNode} ${active === i ? styles.pipeNodeOn : ""}`}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
            >
              <span className={`${styles.pipeDot} ${styles[`pipeHit${i}`]}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.pipeName}>{n.name}</span>
              <span className={styles.pipeSub}>{n.sub}</span>
            </button>
          </div>
        ))}
      </div>

      {/* key={cycle} перезапускает CSS-задержки строк вместе с новым циклом пакетов */}
      <ol className={styles.pipeLog} key={cycle} aria-live="off">
        {lines.map((l, i) => (
          <li key={i} className={styles[`pipeLine${i}`]}>
            <span className={styles.pipeLogWho}>{NODES[i].name}</span>
            <span>{l}</span>
          </li>
        ))}
      </ol>

      <div className={styles.pipeInfo}>
        <div className={styles.pipeInfoHead}>
          <span className={styles.demoNum}>{String(active + 1).padStart(2, "0")}</span>
          <span className={styles.pipeInfoTitle}>{node.title}</span>
        </div>
        <p>{node.text}</p>
      </div>
    </div>
  );
}
