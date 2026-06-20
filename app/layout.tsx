import Script from "next/script";
import type { Metadata } from "next";
import Providers from "./providers";

import "./globals.css";

const DOMAIN = "https://gabdra.pw";

export const metadata: Metadata = {
  metadataBase: new URL(DOMAIN),
  title: {
    default: "Айнур Габдраупов — AI-системы и автоматизации под задачи бизнеса",
    template: "%s | Айнур Габдраупов",
  },
  description:
    "Инженер из нефтегаза, делаю AI-разработку и автоматизацию сам. Боты и ассистенты на своей базе знаний, RAG поверх документов и каталогов, автоматизация рутины, продуктовые MVP — от идеи до рабочего продукта.",
  keywords: [
    // Бренд
    "Айнур Габдраупов", "ainur", "gabdra",
    // AI и автоматизация
    "AI-системы", "AI-автоматизация", "AI решения для бизнеса", "внедрение AI",
    "автоматизация бизнес-процессов", "автоматизация рутины",
    "RAG система", "AI-агенты", "AI-ассистент",
    // Боты и разработка
    "Telegram-бот на заказ", "чат-бот для бизнеса", "разработка под задачу",
    "MVP разработка", "цифровые решения для бизнеса",
  ],
  authors: [{ name: "Айнур Габдраупов", url: DOMAIN }],
  creator: "Айнур Габдраупов",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: DOMAIN,
    siteName: "Айнур Габдраупов",
    title: "Айнур Габдраупов — AI-системы и автоматизации",
    description:
      "Делаю AI-разработку и автоматизацию сам: боты и ассистенты, RAG поверх документов и каталогов, автоматизация рутины, продуктовые MVP. От идеи до рабочего продукта.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Айнур Габдраупов — AI-системы и автоматизации",
    description: "Боты, RAG поверх документов, автоматизация рутины, продуктовые MVP — от идеи до рабочего продукта.",
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
        <meta name="theme-color" content="#fbfbfa" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Person",
                  name: "Айнур Габдраупов",
                  url: "https://gabdra.pw",
                  image: "https://gabdra.pw/ainur-avatar.jpeg",
                  jobTitle: "AI-разработчик, инженер",
                  description: "Инженер из нефтегаза. Делаю AI-системы и автоматизации: боты и ассистенты, RAG поверх документов и каталогов, продуктовые MVP — от идеи до рабочего продукта.",
                  knowsAbout: ["AI-разработка", "автоматизация бизнес-процессов", "RAG", "Telegram-боты", "AI-ассистенты"],
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "sales",
                    url: "https://t.me/foggearthquake_bot",
                    availableLanguage: "Russian",
                  },
                  sameAs: [
                    "https://t.me/foggearthquake_bot",
                    "https://github.com/foggearthquake",
                  ],
                },
                {
                  "@type": "WebSite",
                  url: "https://gabdra.pw",
                  name: "Айнур Габдраупов — AI-системы и автоматизации",
                  inLanguage: "ru",
                },
                {
                  "@type": "Service",
                  serviceType: "AI-системы и автоматизации",
                  provider: { "@type": "Person", name: "Айнур Габдраупов" },
                  areaServed: { "@type": "Country", name: "Russia" },
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "Что можно собрать",
                    itemListElement: [
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI-ассистенты и боты на базе знаний" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "RAG поверх документов и каталогов" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Автоматизация рутины и процессов" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Голосовые AI-решения" } },
                      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Продуктовые MVP и платформы" } },
                    ],
                  },
                },
                {
                  "@type": "FAQPage",
                  mainEntity: [
                    {
                      "@type": "Question",
                      name: "Чем ты занимаешься?",
                      acceptedAnswer: { "@type": "Answer", text: "AI-системы и автоматизации: боты и ассистенты на базе знаний, RAG поверх документов и каталогов, автоматизация рутины, продуктовые MVP. От идеи до рабочего продукта." },
                    },
                    {
                      "@type": "Question",
                      name: "Как начать работу?",
                      acceptedAnswer: { "@type": "Answer", text: "Опиши задачу в Telegram (@foggearthquake_bot) или через форму на сайте. Разберём, и я предложу решение." },
                    },
                    {
                      "@type": "Question",
                      name: "Сколько стоит?",
                      acceptedAnswer: { "@type": "Answer", text: "Зависит от объёма задачи. Назову стоимость после разбора. Первая консультация бесплатная." },
                    },
                    {
                      "@type": "Question",
                      name: "Что после запуска?",
                      acceptedAnswer: { "@type": "Answer", text: "Передаю с документацией, остаюсь на связи. Развиваю итерациями или просто поддерживаю." },
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
