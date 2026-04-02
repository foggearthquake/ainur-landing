import Script from "next/script";
import type { Metadata } from "next";
import Providers from "./providers";

import "./globals.css";

const DOMAIN = "https://gabdra.pw";

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "ainur. — Разработка сайтов, автоматизаций, платформ и AI-решений за 3–7 дней",
    template: "%s | ainur.",
  },
  description:
    "Закрываем цифровые задачи бизнеса: разработка сайтов, лендингов, Telegram-ботов, автоматизаций, платформ, CRM-интеграций, RAG-систем и AI-агентов. От аналитики и проектирования до поддержки готового решения. Результат за 3–7 дней. От 15 000 ₽.",
  keywords: [
    // Основные услуги
    "разработка сайтов", "сайт на заказ", "создание сайта", "заказать сайт",
    "лендинг на заказ", "создание лендинга", "разработка лендинга",
    "разработка веб-приложений", "веб-приложение на заказ",
    "разработка платформы", "создание платформы", "платформа на заказ",
    // Боты и автоматизация
    "Telegram бот на заказ", "разработка Telegram бота", "создание чат-бота",
    "чат-бот для бизнеса", "автоматизация бизнес-процессов",
    "n8n автоматизация", "автоматизация на заказ", "RPA автоматизация",
    // AI и ML
    "AI автоматизация", "AI решения для бизнеса", "искусственный интеллект для бизнеса",
    "RAG система", "AI агенты", "внедрение AI", "AI интеграция",
    "машинное обучение на заказ", "ML решения",
    // Интеграции
    "интеграция CRM", "API интеграция", "интеграция 1С", "интеграция Битрикс24",
    "интеграция AmoCRM", "webhook интеграция",
    // Бизнес-запросы
    "цифровые решения для бизнеса", "цифровая трансформация",
    "IT аутсорсинг", "IT консалтинг", "проектный консалтинг",
    "техническая поддержка сайта", "поддержка веб-приложений",
    "разработка под ключ", "быстрая разработка", "MVP разработка",
    "фрилансер разработчик", "разработчик на заказ",
    // Аналитика и данные
    "парсинг данных", "веб-скрапинг", "аналитика данных",
    "дашборд на заказ", "BI решения",
    // Бренд
    "ainur", "ainur digital", "gabdra",
  ],
  authors: [{ name: "ainur.", url: DOMAIN }],
  creator: "ainur.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: DOMAIN,
    siteName: "ainur.",
    title: "ainur. — Разработка сайтов, автоматизаций, платформ и AI-решений за 3–7 дней",
    description:
      "Закрываем цифровые задачи бизнеса: от разработки любой сложности до консалтинга и поддержки. Сайты, боты, автоматизации, платформы, AI. Результат за 3–7 дней.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ainur. — Разработка сайтов, автоматизаций и AI-решений",
    description: "Закрываем цифровые задачи бизнеса: сайты, боты, платформы, AI — результат за 3–7 дней",
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
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  other: {
    "google-site-verification": "",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "ainur.",
                  url: "https://gabdra.pw",
                  logo: "https://gabdra.pw/Logotip-icon.png",
                  description: "Закрываем цифровые задачи бизнеса: разработка сайтов, автоматизаций, платформ, AI-решений. От аналитики до поддержки готового решения.",
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "sales",
                    url: "https://t.me/foggearthquake_bot",
                    availableLanguage: "Russian",
                  },
                  sameAs: [
                    "https://t.me/foggearthquake_bot",
                    "https://github.com/foggearthquake-star",
                  ],
                },
                {
                  "@type": "WebSite",
                  url: "https://gabdra.pw",
                  name: "ainur. — Разработка цифровых решений",
                  inLanguage: "ru",
                },
                {
                  "@type": "Service",
                  serviceType: "Разработка цифровых решений",
                  provider: { "@type": "Organization", name: "ainur." },
                  areaServed: { "@type": "Country", name: "Russia" },
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "Цифровые услуги",
                    itemListElement: [
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Разработка сайтов и лендингов" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Разработка веб-приложений и платформ" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Telegram-боты и чат-боты" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Автоматизация бизнес-процессов" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI-решения и RAG-системы" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "API-интеграции и CRM" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Проектный консалтинг и поддержка" } },
                    ],
                  },
                },
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "Какие услуги предоставляет ainur.?",
                      acceptedAnswer: { "@type": "Answer", text: "Сайты, лендинги, платформы, веб-приложения, Telegram-боты, автоматизации, RAG-системы, AI-агенты, API-интеграции, проектный консалтинг и поддержка готовых решений." },
                    },
                    {
                      "@type": "Question",
                      name: "Как быстро будет готово?",
                      acceptedAnswer: { "@type": "Answer", text: "Простые задачи — 3–7 дней. Для сложных проектов — за 7 дней согласуем решение и начинаем разработку." },
                    },
                    {
                      "@type": "Question",
                      name: "Сколько стоит разработка?",
                      acceptedAnswer: { "@type": "Answer", text: "От 15 000 ₽. Точная стоимость — после разбора задачи. Первая консультация бесплатная." },
                    },
                    {
                      "@type": "Question",
                      name: "Есть ли поддержка после запуска?",
                      acceptedAnswer: { "@type": "Answer", text: "Да. Передаём с документацией, остаёмся на связи. Развиваем итерациями или просто поддерживаем." },
                    },
                  ],
                },
              ],
            }),
          }}
        />
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
