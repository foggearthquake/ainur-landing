import type { Metadata } from "next";
import Providers from "./providers";

import "./globals.css";

const DOMAIN = "https://gabdra.pw";

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "ainur. — AI Forge | Автоматизации, RAG, AI-агенты для бизнеса",
    template: "%s | ainur.",
  },
  description:
    "Кую AI-решения для бизнеса: автоматизации на n8n, RAG-системы, Telegram-боты, API-интеграции, AI-агенты. От 15 000 ₽. Первый разговор бесплатный.",
  keywords: [
    "AI автоматизация", "RAG система", "Telegram бот на заказ", "n8n автоматизация",
    "AI агенты", "автоматизация бизнес-процессов", "интеграция CRM",
    "чат-бот для бизнеса", "AI решения", "ainur", "разработка ботов",
  ],
  authors: [{ name: "ainur.", url: DOMAIN }],
  creator: "ainur.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: DOMAIN,
    siteName: "ainur.",
    title: "ainur. — AI Forge | Автоматизации, RAG, AI-агенты",
    description:
      "Кую AI-решения: автоматизации, RAG, боты, интеграции. От 15 000 ₽. Работает — или переделываю.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ainur. — AI Forge",
    description: "AI-автоматизации, RAG-системы, боты и интеграции для бизнеса",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: DOMAIN,
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
        <link rel="icon" href="/Logotip-icon.png" type="image/png" />
        <meta name="theme-color" content="#0c0c0c" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
