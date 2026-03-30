"use client";

import { useState } from "react";

import styles from "./friendly-cyberpunk-v1.module.css";

const terminalLines = [
  {
    command: 'intake --source="telegram, crm, forms"',
    output: "Собираем входящие из Telegram, CRM и форм в один поток.",
  },
  {
    command: 'design --flow "input → routing → action"',
    output: "Логика: что приходит, куда идёт, какое действие запускается.",
  },
  {
    command: 'build --stack "llm, api, crm, tg, db"',
    output: "Связка: модель, API, CRM, Telegram, база данных.",
  },
  {
    command: "ship --mode production",
    output: "В продакшн. Не демо, а рабочая система.",
  },
];

export default function TerminalMock() {
  const [draft, setDraft] = useState("");

  return (
    <div className={styles.terminalCard}>
      <div className={styles.terminalBar}>
        <span className={`${styles.dot} ${styles.dotRed}`} />
        <span className={`${styles.dot} ${styles.dotYellow}`} />
        <span className={`${styles.dot} ${styles.dotGreen}`} />
        <span className={styles.terminalTitle}>ainur-forge.ts</span>
      </div>

      <div className={styles.terminalBody}>
        {terminalLines.map((line) => (
          <div key={line.command} className={styles.terminalGroup}>
            <div className={styles.terminalLine}>
              <span className={styles.prompt}>⟩</span>
              <span className={styles.command}>{line.command}</span>
            </div>
            <div className={styles.terminalOutput}>{line.output}</div>
          </div>
        ))}

        <div className={styles.terminalInputWrap}>
          <div className={styles.terminalLine}>
            <span className={styles.prompt}>⟩</span>
            <input
              aria-label="terminal easter egg"
              className={styles.terminalInput}
              placeholder="describe --your-task"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.stackList}>
        {["LLM", "RAG", "n8n", "Webhook", "API", "Telegram", "CRM", "AI"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}
