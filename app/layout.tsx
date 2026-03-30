import Script from "next/script";
import type { Metadata } from "next";
import Providers from "./providers";

import "./globals.css";

const DOMAIN = "https://gabdra.pw";

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "ainur. — Digital & AI Forge | Сайты, автоматизации, платформы за 3–7 дней",
    template: "%s | ainur.",
  },
  description:
    "Любые цифровые решения: сайты, лендинги, Telegram-боты, автоматизации, платформы, RAG-системы, AI-агенты. Рабочий результат за 3–7 дней. От 15 000 ₽.",
  keywords: [
    "сайт на заказ", "лендинг на заказ", "разработка сайтов", "веб-приложение",
    "AI автоматизация", "RAG система", "Telegram бот на заказ", "n8n автоматизация",
    "AI агенты", "автоматизация бизнес-процессов", "интеграция CRM",
    "чат-бот для бизнеса", "цифровые решения", "ainur", "платформа на заказ",
  ],
  authors: [{ name: "ainur.", url: DOMAIN }],
  creator: "ainur.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: DOMAIN,
    siteName: "ainur.",
    title: "ainur. — Digital & AI Forge | Сайты, автоматизации, платформы",
    description:
      "Любые цифровые решения за 3–7 дней: сайты, боты, автоматизации, платформы, AI-системы. От 15 000 ₽.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ainur. — Digital & AI Forge",
    description: "Сайты, автоматизации, платформы, AI-системы — рабочий результат за 3–7 дней",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: DOMAIN,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/Logotip-icon.png", type: "image/png" },
    ],
    apple: "/Logotip-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0c0c0c" />
      </head>
      <body>
        <Providers>{children}</Providers>

        {/* Яндекс.Метрика */}
        <Script id="ym-init" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
            ym(108301751,'init',{
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true,
              webvisor: true
            });
          `}
        </Script>
        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/108301751"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
