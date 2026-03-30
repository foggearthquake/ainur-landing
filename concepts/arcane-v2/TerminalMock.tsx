"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./arcane-v2.module.css";

const scenes = [
  {
    command: 'intake --source="telegram, crm, forms"',
    output: "Входящие из Telegram, CRM и форм → один поток.",
  },
  {
    command: 'design --flow "input → routing → action"',
    output: "Маршрут: откуда данные, куда летят, что запускают.",
  },
  {
    command: 'build --stack "llm, api, crm, tg, db"',
    output: "Связка: модель + API + CRM + Telegram + БД.",
  },
  {
    command: "ship --mode production",
    output: "Продакшн. Не демо — рабочая система.",
  },
  {
    command: "monitor --uptime --alerts",
    output: "Мониторинг, алерты, поддержка. Не исчезаю.",
  },
];

export default function TerminalMock() {
  const [currentScene, setCurrentScene] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [displayedCmd, setDisplayedCmd] = useState("");
  const [showOutput, setShowOutput] = useState(false);
  const [draft, setDraft] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const typeScene = useCallback((sceneIndex: number) => {
    const scene = scenes[sceneIndex];
    let charIdx = 0;
    setShowOutput(false);
    setDisplayedCmd("");

    const typeInterval = setInterval(() => {
      charIdx++;
      setDisplayedCmd(scene.command.slice(0, charIdx));
      if (charIdx >= scene.command.length) {
        clearInterval(typeInterval);
        setTimeout(() => setShowOutput(true), 300);
      }
    }, 30);

    return typeInterval;
  }, []);

  useEffect(() => {
    if (!isHovering) {
      setDisplayedCmd(scenes[currentScene].command);
      setShowOutput(true);
      return;
    }

    const typeInt = typeScene(currentScene);

    intervalRef.current = setInterval(() => {
      setCurrentScene((prev) => {
        const next = (prev + 1) % scenes.length;
        typeScene(next);
        return next;
      });
    }, 4000);

    return () => {
      clearInterval(typeInt);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovering, currentScene, typeScene]);

  const scene = scenes[currentScene];

  return (
    <div
      className={styles.terminalCard}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={styles.terminalBar}>
        <span className={`${styles.dot} ${styles.dotRed}`} />
        <span className={`${styles.dot} ${styles.dotYellow}`} />
        <span className={`${styles.dot} ${styles.dotGreen}`} />
        <span className={styles.terminalTitle}>ainur-forge.ts</span>
      </div>

      <div className={styles.terminalBody}>
        <div key={currentScene} className={styles.terminalFade}>
          <div className={styles.terminalGroup}>
            <div className={styles.terminalLine}>
              <span className={styles.prompt}>⟩</span>
              <span className={styles.command}>
                {isHovering ? displayedCmd : scene.command}
                {isHovering && !showOutput && (
                  <span className={styles.cursor}>▌</span>
                )}
              </span>
            </div>
            {showOutput && (
              <div className={`${styles.terminalOutput} ${styles.terminalFade}`}>
                {scene.output}
              </div>
            )}
          </div>
        </div>

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
        {["LLM", "RAG", "n8n", "Webhook", "API", "Telegram", "CRM", "AI"].map(
          (item) => (
            <span key={item}>{item}</span>
          )
        )}
      </div>
    </div>
  );
}
