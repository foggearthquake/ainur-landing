import { sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import type { ChatMessage } from "@/lib/assistant-knowledge";

export type TelegramAssistantMode = "welcome" | "lead" | "question";

export type TelegramAssistantSession = {
  chatId: string;
  mode: TelegramAssistantMode;
  stepIndex: number;
  answers: Record<string, string>;
};

const MAX_HISTORY = 15;

async function ensureTelegramSessionSchema() {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS telegram_sessions (
      chat_id TEXT PRIMARY KEY NOT NULL,
      mode TEXT NOT NULL,
      step_index INTEGER NOT NULL DEFAULT 0,
      answers_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS telegram_chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function getTelegramSession(chatId: string): Promise<TelegramAssistantSession | null> {
  await ensureTelegramSessionSchema();
  const result = await db.run(
    sql`SELECT chat_id, mode, step_index, answers_json FROM telegram_sessions WHERE chat_id = ${chatId} LIMIT 1`,
  );

  const row = result.rows[0] as unknown as
    | {
        chat_id: string;
        mode: TelegramAssistantMode;
        step_index: number;
        answers_json: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    chatId: row.chat_id,
    mode: row.mode,
    stepIndex: Number(row.step_index) || 0,
    answers: JSON.parse(row.answers_json || "{}") as Record<string, string>,
  };
}

export async function saveTelegramSession(session: TelegramAssistantSession) {
  await ensureTelegramSessionSchema();
  await db.run(sql`
    INSERT INTO telegram_sessions (chat_id, mode, step_index, answers_json, updated_at)
    VALUES (${session.chatId}, ${session.mode}, ${session.stepIndex}, ${JSON.stringify(session.answers)}, CURRENT_TIMESTAMP)
    ON CONFLICT(chat_id) DO UPDATE SET
      mode = excluded.mode,
      step_index = excluded.step_index,
      answers_json = excluded.answers_json,
      updated_at = CURRENT_TIMESTAMP
  `);
}

export async function clearTelegramSession(chatId: string) {
  await ensureTelegramSessionSchema();
  await db.run(sql`DELETE FROM telegram_sessions WHERE chat_id = ${chatId}`);
}

/* ── Chat history ── */

export async function getChatHistory(chatId: string): Promise<ChatMessage[]> {
  await ensureTelegramSessionSchema();
  const result = await db.run(
    sql`SELECT role, content FROM telegram_chat_history WHERE chat_id = ${chatId} ORDER BY id DESC LIMIT ${MAX_HISTORY}`,
  );

  const rows = (result.rows as unknown as { role: string; content: string }[]) || [];
  // Reverse to chronological order (query returns newest first)
  return rows.reverse().map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content,
  }));
}

export async function addChatMessage(chatId: string, role: "user" | "assistant", content: string) {
  await ensureTelegramSessionSchema();
  await db.run(
    sql`INSERT INTO telegram_chat_history (chat_id, role, content) VALUES (${chatId}, ${role}, ${content})`,
  );
  // Trim old messages beyond limit
  await db.run(sql`
    DELETE FROM telegram_chat_history
    WHERE chat_id = ${chatId}
    AND id NOT IN (
      SELECT id FROM telegram_chat_history WHERE chat_id = ${chatId} ORDER BY id DESC LIMIT ${MAX_HISTORY}
    )
  `);
}

export async function clearChatHistory(chatId: string) {
  await ensureTelegramSessionSchema();
  await db.run(sql`DELETE FROM telegram_chat_history WHERE chat_id = ${chatId}`);
}
