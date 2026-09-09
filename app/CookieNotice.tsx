"use client";

import { useEffect, useState } from "react";

const ACK_KEY = "ainur-cookie-ack";

/** Discreet cookie/analytics notice. Yandex.Metrica (with Webvisor) sets cookies and
 *  records on-page behaviour, so visitors have to be told. Inline styles on purpose:
 *  this renders inside the root layout, above both the main site (CSS modules) and
 *  /site (scoped Tailwind), so it must not depend on either stylesheet. */
export default function CookieNotice() {
  const [show, setShow] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let acked = null;
    try {
      acked = window.localStorage.getItem(ACK_KEY);
    } catch {
      acked = null; // private mode / blocked storage — just show it
    }
    if (acked) return;
    const t = window.setTimeout(() => {
      setShow(true);
      window.setTimeout(() => setVisible(true), 30); // fade in
    }, 1400);
    return () => window.clearTimeout(t);
  }, []);

  if (!show) return null;

  const accept = () => {
    try {
      window.localStorage.setItem(ACK_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
    window.setTimeout(() => setShow(false), 260);
  };

  return (
    <div
      role="region"
      aria-label="Уведомление об использовании cookie"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 60,
        maxWidth: 430,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px 10px 14px",
        borderRadius: 14,
        background: "rgba(14,14,17,0.92)",
        border: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 18px 40px -22px rgba(0,0,0,0.9)",
        color: "rgba(255,255,255,0.72)",
        fontSize: 12.5,
        lineHeight: 1.45,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity .25s ease, transform .25s ease",
      }}
    >
      <span>
        Сайт использует cookie и Яндекс.Метрику для аналитики.{" "}
        <a
          href="/privacy"
          style={{ color: "rgba(255,255,255,0.95)", textDecoration: "underline", textUnderlineOffset: 2 }}
        >
          Подробнее
        </a>
      </span>
      <button
        type="button"
        onClick={accept}
        style={{
          flexShrink: 0,
          marginLeft: "auto",
          padding: "7px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.10)",
          color: "#fff",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Понятно
      </button>
    </div>
  );
}
