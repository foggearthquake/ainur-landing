import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { articles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";

export const revalidate = 60;

async function getArticle(slug: string) {
  try {
    const db = drizzle(createClient({ url: process.env.DATABASE_URL! }));
    return await db.select().from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
      .get();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Статья не найдена" };
  return {
    title: article.title,
    description: article.content.slice(0, 160).replace(/[#*`]/g, ""),
    alternates: { canonical: `https://gabdra.pw/blog/${slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      publishedTime: article.publishedAt ?? undefined,
    },
  };
}

function renderMarkdown(text: string): string {
  // Basic markdown → HTML (server-side, no deps)
  return text
    // headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="art-title">$1</h1>')
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // hr
    .replace(/^---$/gm, '<hr>')
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // paragraphs (double newline)
    .split(/\n\n+/)
    .map(block => {
      if (block.startsWith('<h') || block.startsWith('<hr')) return block;
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ArticlePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const html = renderMarkdown(article.content);

  return (
    <>
      <style>{`
        .art-body { max-width: 680px; margin: 0 auto; padding: 80px 24px 120px; }
        .art-body h1.art-title { display: none; }
        .art-body h2 {
          font-family: var(--font-heading);
          font-size: clamp(20px, 3vw, 26px);
          font-weight: 500;
          color: #ebebeb;
          margin: 48px 0 16px;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .art-body h3 {
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 600;
          color: #c9a84c;
          margin: 32px 0 12px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          font-size: 12px;
        }
        .art-body p {
          font-family: var(--font-body);
          font-size: 16px;
          line-height: 1.85;
          color: #b8b4ad;
          margin: 0 0 20px;
        }
        .art-body strong { color: #e8e4dc; font-weight: 600; }
        .art-body em { color: #9a9590; font-style: italic; }
        .art-body code {
          font-family: var(--font-mono);
          font-size: 13px;
          background: #161616;
          border: 1px solid #262626;
          border-radius: 3px;
          padding: 1px 6px;
          color: #c9a84c;
        }
        .art-body a { color: #c9a84c; text-decoration: none; border-bottom: 1px solid #c9a84c33; }
        .art-body a:hover { border-bottom-color: #c9a84c; }
        .art-body hr { border: none; border-top: 1px solid #1f1f1f; margin: 48px 0; }
        @media (max-width: 640px) {
          .art-body { padding: 48px 20px 80px; }
        }
      `}</style>

      <main className="art-body">
        <Link
          href="/blog"
          style={{ color: "#6b6760", fontSize: 13, textDecoration: "none", fontFamily: "var(--font-body)" }}
        >
          ← Блог
        </Link>

        <div style={{ marginTop: 40, marginBottom: 40 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
            {article.lang === "en" && (
              <span style={{
                fontSize: 11, color: "#6b6760", border: "1px solid #333", borderRadius: 3,
                padding: "1px 6px", fontFamily: "var(--font-mono)", letterSpacing: "0.05em",
              }}>EN</span>
            )}
            <span style={{ color: "#6b6760", fontSize: 13, fontFamily: "var(--font-body)" }}>
              {formatDate(article.publishedAt ?? article.createdAt)}
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 500,
            color: "#ebebeb",
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}>
            {article.title}
          </h1>

          <div style={{
            marginTop: 16,
            fontSize: 13,
            color: "#6b6760",
            fontFamily: "var(--font-body)",
          }}>
            <Link href="/" style={{ color: "#c9a84c", textDecoration: "none" }}>ainur.</Link>
          </div>
        </div>

        <div
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ borderTop: "1px solid #1a1a1a", paddingTop: 40 }}
        />
      </main>
    </>
  );
}
