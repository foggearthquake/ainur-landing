import Link from "next/link";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог — AI и технологии",
  description: "Статьи ainur. об AI, автоматизации, IoT и разработке цифровых продуктов.",
};

export const revalidate = 60; // revalidate every 60s

async function getPublishedArticles() {
  try {
    const db = drizzle(createClient({ url: process.env.DATABASE_URL! }));
    return await db.select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      lang: articles.lang,
      qualityScore: articles.qualityScore,
      publishedAt: articles.publishedAt,
      createdAt: articles.createdAt,
    })
      .from(articles)
      .where(eq(articles.status, "published"))
      .orderBy(articles.publishedAt);
  } catch {
    return [];
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const posts = await getPublishedArticles();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "80px 24px" }}>
      <Link
        href="/"
        style={{ color: "#c9a84c", fontSize: 13, textDecoration: "none", fontFamily: "var(--font-body)" }}
      >
        ← ainur.
      </Link>

      <div style={{ marginTop: 40, marginBottom: 56 }}>
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 500,
            color: "#ebebeb",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Блог
        </h1>
        <p style={{ color: "#6b6760", fontSize: 15, fontFamily: "var(--font-body)", margin: 0 }}>
          AI, автоматизация, IoT — без воды
        </p>
      </div>

      {posts.length === 0 ? (
        <p style={{ color: "#6b6760", fontFamily: "var(--font-body)", fontSize: 15 }}>
          Статьи скоро появятся.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {posts.map((post, i) => (
            <li
              key={post.id}
              style={{
                borderTop: i === 0 ? "1px solid #222" : "none",
                borderBottom: "1px solid #222",
                padding: "28px 0",
              }}
            >
              <Link
                href={`/blog/${post.slug}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {post.lang === "en" && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#6b6760",
                        border: "1px solid #333",
                        borderRadius: 3,
                        padding: "1px 6px",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      EN
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: "#6b6760", fontFamily: "var(--font-body)" }}>
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(16px, 2.5vw, 20px)",
                    fontWeight: 500,
                    color: "#ebebeb",
                    margin: 0,
                    lineHeight: 1.4,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = "#c9a84c")}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = "#ebebeb")}
                >
                  {post.title}
                </h2>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid #1a1a1a" }}>
        <p style={{ color: "#6b6760", fontSize: 13, fontFamily: "var(--font-body)", margin: 0 }}>
          <Link href="/" style={{ color: "#c9a84c", textDecoration: "none" }}>ainur.</Link>
          {" "}— разработка AI-решений, автоматизаций и платформ за 3–7 дней.
        </p>
      </div>
    </main>
  );
}
