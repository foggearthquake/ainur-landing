import type { ReactNode } from "react";
import { Manrope } from "next/font/google";

// Tailwind tokens — loaded ONLY for /site routes, so the main gabdra.pw
// bundle never sees Tailwind's preflight or utilities.
import "./site.css";

// One clean grotesk with full Cyrillic, self-hosted (loads in RU without VPN).
// Hierarchy is driven by weight + colour, not by a second display face.
const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans-site",
  display: "swap",
});

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${sans.variable} min-h-[100dvh] bg-background font-sans text-foreground antialiased`}>
      {children}
    </div>
  );
}
