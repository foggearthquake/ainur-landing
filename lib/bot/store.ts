/* Bot state in Turso: per-chat mode and flow, update dedup + rate limit, demo-clinic bookings. */
import { libsql } from "@/lib/db/client";

export type Mode = "menu" | "sales" | "demo";

export type Flow =
  | { kind: "none" }
  | { kind: "lead"; step: "task" | "contact"; type?: string }
  | {
      kind: "book";
      step: "service" | "doctor" | "day" | "time" | "name" | "confirm";
      service?: string;
      doctor?: string;
      day?: string;
      time?: string;
      part?: "morning" | "afternoon" | "evening";
      page?: number;
      name?: string;
      resched?: number;
    };

export type ChatState = { chatId: string; mode: Mode; flow: Flow; manual: boolean };

export type Booking = {
  id: number;
  chatId: string;
  service: string;
  doctor: string;
  start: string; // "YYYY-MM-DDTHH:MM", Moscow time
  end: string;
  patient: string;
  status: "confirmed" | "cancelled";
  reschedules: number;
};

let ready: Promise<unknown> | null = null;
function ensure() {
  ready ??= libsql.batch(
    [
      `CREATE TABLE IF NOT EXISTS bot_chats (
        chat_id TEXT PRIMARY KEY NOT NULL,
        mode TEXT NOT NULL DEFAULT 'menu',
        flow TEXT NOT NULL DEFAULT '{"kind":"none"}',
        manual INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS bot_updates (
        update_id INTEGER PRIMARY KEY NOT NULL,
        chat_id TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'm',
        at INTEGER NOT NULL)`,
      `CREATE INDEX IF NOT EXISTS bot_updates_chat ON bot_updates (chat_id, kind, at)`,
      `CREATE TABLE IF NOT EXISTS demo_bookings (
        id INTEGER PRIMARY KEY NOT NULL,
        chat_id TEXT NOT NULL,
        service TEXT NOT NULL,
        doctor TEXT NOT NULL,
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL,
        patient TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        reschedules INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      // one row per occupied 30-minute cell: a second booking of the same cell violates the key
      `CREATE TABLE IF NOT EXISTS demo_cells (
        doctor TEXT NOT NULL,
        cell TEXT NOT NULL,
        booking_id INTEGER NOT NULL,
        PRIMARY KEY (doctor, cell))`,
    ],
    "write",
  ).catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

/* duplicate = Telegram retried an update we already handled; flood = more than 20 messages a minute
   from the chat (button presses are recorded for dedup but not counted — they never reach the model) */
export async function admit(updateId: number, chatId: string, kind: "m" | "c"): Promise<"ok" | "duplicate" | "flood" | "flood-warn"> {
  await ensure();
  const now = Math.floor(Date.now() / 1000);
  const ins = await libsql.execute({
    sql: "INSERT INTO bot_updates (update_id, chat_id, kind, at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
    args: [updateId, chatId, kind, now],
  });
  if (ins.rowsAffected === 0) return "duplicate";
  if (updateId % 50 === 0) await libsql.execute({ sql: "DELETE FROM bot_updates WHERE at < ?", args: [now - 3 * 86400] });
  if (kind === "c") return "ok";
  const c = await libsql.execute({
    sql: "SELECT COUNT(*) AS n FROM bot_updates WHERE chat_id = ? AND kind = 'm' AND at > ?",
    args: [chatId, now - 60],
  });
  const n = Number(c.rows[0]?.n ?? 0);
  if (n === 21) return "flood-warn";
  return n > 21 ? "flood" : "ok";
}

export async function getChat(chatId: string): Promise<ChatState> {
  await ensure();
  const r = await libsql.execute({ sql: "SELECT mode, flow, manual FROM bot_chats WHERE chat_id = ?", args: [chatId] });
  const row = r.rows[0];
  if (!row) return { chatId, mode: "menu", flow: { kind: "none" }, manual: false };
  let flow: Flow = { kind: "none" };
  try {
    flow = JSON.parse(String(row.flow)) as Flow;
  } catch {
    /* keep none */
  }
  return { chatId, mode: (String(row.mode) as Mode) || "menu", flow, manual: Number(row.manual) === 1 };
}

export async function saveChat(s: ChatState) {
  await ensure();
  await libsql.execute({
    sql: `INSERT INTO bot_chats (chat_id, mode, flow, manual, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(chat_id) DO UPDATE SET mode = excluded.mode, flow = excluded.flow,
          manual = excluded.manual, updated_at = CURRENT_TIMESTAMP`,
    args: [s.chatId, s.mode, JSON.stringify(s.flow), s.manual ? 1 : 0],
  });
}

/* ── demo clinic ── */

const toBooking = (r: Record<string, unknown>): Booking => ({
  id: Number(r.id),
  chatId: String(r.chat_id),
  service: String(r.service),
  doctor: String(r.doctor),
  start: String(r.start_at),
  end: String(r.end_at),
  patient: String(r.patient),
  status: String(r.status) as Booking["status"],
  reschedules: Number(r.reschedules),
});

/* occupied cells of a doctor for days [fromDay, toDay) — one query for the whole horizon */
export async function busyCells(doctor: string, fromDay: string, toDay: string): Promise<Set<string>> {
  await ensure();
  const r = await libsql.execute({
    sql: "SELECT cell FROM demo_cells WHERE doctor = ? AND cell >= ? AND cell < ?",
    args: [doctor, fromDay, toDay],
  });
  return new Set(r.rows.map((x) => String(x.cell)));
}

const cellRows = (doctor: string, cells: string[], id: number) =>
  cells.map((cell) => ({ sql: "INSERT INTO demo_cells (doctor, cell, booking_id) VALUES (?, ?, ?)", args: [doctor, cell, id] }));

/* One transaction: the booking and all its cells, or nothing (cell already taken → null). */
export async function createBooking(b: Omit<Booking, "id" | "status" | "reschedules">, cells: string[]): Promise<number | null> {
  await ensure();
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = 10000 + Math.floor(Math.random() * 90000); // short number to read out: D-48213
    try {
      await libsql.batch(
        [
          {
            sql: `INSERT INTO demo_bookings (id, chat_id, service, doctor, start_at, end_at, patient)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [id, b.chatId, b.service, b.doctor, b.start, b.end, b.patient],
          },
          ...cellRows(b.doctor, cells, id),
        ],
        "write",
      );
      return id;
    } catch (error) {
      if (!/demo_bookings\.id/.test(String(error))) return null; // a taken cell, not a number clash
    }
  }
  return null;
}

/* Swap the time atomically; if the new cells are taken the old booking stays as it was. */
export async function moveBooking(chatId: string, id: number, start: string, end: string, doctor: string, cells: string[]) {
  await ensure();
  try {
    await libsql.batch(
      [
        { sql: "DELETE FROM demo_cells WHERE booking_id = ?", args: [id] },
        {
          sql: `UPDATE demo_bookings SET start_at = ?, end_at = ?, doctor = ?, reschedules = reschedules + 1
                WHERE id = ? AND chat_id = ? AND status = 'confirmed'`,
          args: [start, end, doctor, id, chatId],
        },
        ...cellRows(doctor, cells, id),
      ],
      "write",
    );
    return true;
  } catch {
    return false;
  }
}

export async function cancelBooking(chatId: string, id: number) {
  await ensure();
  const own = await getBooking(chatId, id);
  if (!own || own.status !== "confirmed") return false;
  await libsql.batch(
    [
      { sql: "UPDATE demo_bookings SET status = 'cancelled' WHERE id = ? AND chat_id = ?", args: [id, chatId] },
      { sql: "DELETE FROM demo_cells WHERE booking_id = ?", args: [id] },
    ],
    "write",
  );
  return true;
}

/* chat_id in every query: a booking of another user is invisible (no IDOR through callback data) */
export async function getBooking(chatId: string, id: number): Promise<Booking | null> {
  await ensure();
  const r = await libsql.execute({ sql: "SELECT * FROM demo_bookings WHERE id = ? AND chat_id = ?", args: [id, chatId] });
  return r.rows[0] ? toBooking(r.rows[0] as Record<string, unknown>) : null;
}

export async function futureBookings(chatId: string, nowKey: string): Promise<Booking[]> {
  await ensure();
  const r = await libsql.execute({
    sql: `SELECT * FROM demo_bookings WHERE chat_id = ? AND status = 'confirmed' AND start_at > ?
          ORDER BY start_at LIMIT 5`,
    args: [chatId, nowKey],
  });
  return r.rows.map((x) => toBooking(x as Record<string, unknown>));
}
