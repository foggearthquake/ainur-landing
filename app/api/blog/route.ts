import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { articles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const db = drizzle(createClient({ url: process.env.DATABASE_URL! }));

const API_KEY = process.env.BLOG_API_KEY ?? "";

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

  const now = new Date().toISOString();

  // Upsert by slug
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

// GET /api/blog?status=published — list articles
export async function GET(req: NextRequest) {
  if (!API_KEY || req.headers.get("x-api-key") !== API_KEY) return unauthorized();

  const status = req.nextUrl.searchParams.get("status");
  const all = await db.select().from(articles)
    .orderBy(articles.createdAt);

  const filtered = status ? all.filter(a => a.status === status) : all;
  return NextResponse.json({ articles: filtered });
}
