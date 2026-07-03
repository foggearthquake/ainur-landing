import type { Metadata } from "next";

import SitePresentationLanding from "@/concepts/site-presentation-v1/SitePresentationLanding";

export const metadata: Metadata = {
  title: "Сайт для вашего бизнеса за 5–7 дней — Айнур Габдраупов",
  description:
    "Делаю сайты для малого бизнеса: кафе, салонов, автосервисов. Одна страница, которая собирает все заявки в одно место. 10 000–15 000 ₽, срок 5–7 дней. Бесплатный макет за 1–2 дня.",
  alternates: { canonical: "https://site.gabdra.pw" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://site.gabdra.pw",
    title: "Сайт для вашего бизнеса за 5–7 дней",
    description:
      "Одна страница, которая собирает заявки из всех каналов в одно место. 10 000–15 000 ₽, 5–7 дней. Бесплатный макет за 1–2 дня.",
  },
};

export default function SitePage() {
  return <SitePresentationLanding />;
}
