import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import HubLanding from "@/concepts/hub-v2/HubLanding";

// Cyrillic-capable and self-hosted at build time (loads in RU without VPN)
const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hub",
  display: "swap",
});
// bold serif line under the card, as in MiniMax H3
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["700"],
  variable: "--font-hub-serif",
  display: "swap",
});

const TITLE = "ainur. — сайты, AI-системы и AI-креатив";
const DESCRIPTION =
  "Цифровые продукты под задачу бизнеса: сайты, которые доводят клиента до заявки, AI-системы и автоматизация, ИИ-видео и генерация.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: { type: "website", locale: "ru_RU", siteName: "ainur.", url: "https://gabdra.pw", title: TITLE, description: DESCRIPTION },
};

export default function Home() {
  return (
    <div className={`${manrope.variable} ${playfair.variable}`}>
      <HubLanding />
    </div>
  );
}
