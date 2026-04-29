import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),      // Markdown
  lang: text("lang").notNull().default("ru"),
  status: text("status").notNull().default("draft"), // draft | published
  qualityScore: integer("quality_score").notNull().default(0),
  publishedAt: text("published_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  // posting status per platform
  postedVc: integer("posted_vc", { mode: "boolean" }).notNull().default(false),
  postedMedium: integer("posted_medium", { mode: "boolean" }).notNull().default(false),
  postedHabr: integer("posted_habr", { mode: "boolean" }).notNull().default(false),
});

export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  telegramOrEmail: text("telegram_or_email").notNull(),
  projectSummary: text("project_summary").notNull(),
  budgetRange: text("budget_range").notNull(),
  consent: text("consent").notNull().default("true"),
  source: text("source").notNull(),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
