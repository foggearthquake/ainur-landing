/* Thin Telegram Bot API client: HTML messages with inline keyboards, edits, files. */

export type Button = { text: string; callback_data?: string; url?: string };
export type Keyboard = Button[][];

export type TgUser = { id: number; first_name?: string; username?: string };
export type TgMessage = {
  message_id: number;
  chat: { id: number; type?: string };
  from?: TgUser;
  text?: string;
  caption?: string;
  voice?: { file_id: string; duration: number; file_size?: number; mime_type?: string };
  audio?: { file_id: string; duration: number; file_size?: number; mime_type?: string };
  photo?: unknown[];
  document?: unknown;
  sticker?: unknown;
  video?: unknown;
  video_note?: unknown;
  reply_to_message?: TgMessage;
};
export type TgCallback = { id: string; from: TgUser; data?: string; message?: TgMessage };
export type TgUpdate = { update_id: number; message?: TgMessage; callback_query?: TgCallback };

const api = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function tg(method: string, body: object): Promise<{ ok: boolean; result?: unknown; description?: string }> {
  try {
    const r = await fetch(`${api()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = (await r.json().catch(() => null)) as { ok: boolean; result?: unknown; description?: string } | null;
    if (!d?.ok) console.error("telegram", method, d?.description);
    return d ?? { ok: false };
  } catch (error) {
    console.error("telegram", method, error);
    return { ok: false };
  }
}

const markup = (kb?: Keyboard) => (kb ? { inline_keyboard: kb } : undefined);

export function send(chatId: number | string, text: string, kb?: Keyboard, extra: object = {}) {
  return tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_markup: markup(kb),
    ...extra,
  });
}

/* Flows edit the message the button sits on, so the chat does not fill up with menus. */
export async function edit(chatId: number | string, messageId: number | undefined, text: string, kb?: Keyboard) {
  if (messageId) {
    const r = await tg("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      reply_markup: markup(kb),
    });
    if (r.ok || /not modified/i.test(r.description ?? "")) return r;
  }
  return send(chatId, text, kb);
}

export const answerCallback = (id: string, text?: string) => tg("answerCallbackQuery", { callback_query_id: id, text });

export const typing = (chatId: number | string) => tg("sendChatAction", { chat_id: chatId, action: "typing" });

export async function downloadFile(fileId: string): Promise<Blob | null> {
  const r = await tg("getFile", { file_id: fileId });
  const path = (r.result as { file_path?: string } | undefined)?.file_path;
  if (!r.ok || !path) return null;
  try {
    const f = await fetch(`https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${path}`);
    return f.ok ? await f.blob() : null;
  } catch {
    return null;
  }
}
