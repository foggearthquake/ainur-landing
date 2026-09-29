import type { Metadata } from "next";

// Served at ai.gabdra.pw (middleware rewrites its root here); gabdra.pw is now the hub.
export { default } from "@/concepts/ink-swarm-v1/InkSwarmLanding";

export const metadata: Metadata = {
  title: { absolute: "ainur. — AI-системы и автоматизации под задачи бизнеса" },
  alternates: { canonical: "https://ai.gabdra.pw" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "ainur.",
    url: "https://ai.gabdra.pw",
    title: "ainur. — AI-системы и автоматизации",
    description:
      "Делаю AI-разработку и автоматизацию сам: боты и ассистенты, RAG поверх документов и каталогов, автоматизация рутины, продуктовые MVP. От идеи до рабочего продукта.",
  },
};
