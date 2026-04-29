import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const libsql = createClient({ url: process.env.DATABASE_URL! });
const db = drizzle(libsql);
const API_KEY = process.env.BLOG_API_KEY ?? "";

// Auto-create articles table on first request (no manual migration needed)
let _tableReady = false;
async function ensureTable() {
  if (_tableReady) return;
  await libsql.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      lang TEXT NOT NULL DEFAULT 'ru',
      status TEXT NOT NULL DEFAULT 'draft',
      quality_score INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      posted_vc INTEGER NOT NULL DEFAULT 0,
      posted_medium INTEGER NOT NULL DEFAULT 0,
      posted_habr INTEGER NOT NULL DEFAULT 0
    )
  `);
  _tableReady = true;
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// POST /api/blog — create or update article
export async function POST(req: NextRequest) {
  if (!API_KEY || req.headers.get("x-api-key") !== API_KEY) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.title || !body?.content) {
    return NextResponse.json({ error: "slug, title, content required" }, { status: 400 });
  }

  await ensureTable();
  const now = new Date().toISOString();

  const existing = await db.select().from(articles).where(eq(articles.slug, body.slug)).get();

  if (existing) {
    await db.update(articles)
      .set({
        title: body.title,
        content: body.content,
        lang: body.lang ?? existing.lang,
        status: body.status ?? existing.status,
        qualityScore: body.quality_score ?? existing.qualityScore,
        publishedAt: body.status === "published" ? (existing.publishedAt ?? now) : existing.publishedAt,
        updatedAt: now,
      })
      .where(eq(articles.slug, body.slug));
    return NextResponse.json({ ok: true, id: existing.id, action: "updated" });
  } else {
    const id = randomUUID();
    await db.insert(articles).values({
      id,
      slug: body.slug,
      title: body.title,
      content: body.content,
      lang: body.lang ?? "ru",
      status: body.status ?? "draft",
      qualityScore: body.quality_score ?? 0,
      publishedAt: body.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    });
    return NextResponse.json({ ok: true, id, action: "created" });
  }
}

// GET /api/blog — list articles (for bot)
export async function GET(req: NextRequest) {
  if (!API_KEY || req.headers.get("x-api-key") !== API_KEY) return unauthorized();
  await ensureTable();

  const status = req.nextUrl.searchParams.get("status");
  const all = await db.select().from(articles).orderBy(articles.createdAt);
  const filtered = status ? all.filter(a => a.status === status) : all;
  return NextResponse.json({ articles: filtered });
}
