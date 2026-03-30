import { NextRequest, NextResponse } from "next/server";

import { handleTelegramUpdate } from "@/lib/telegram-assistant";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const header = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret && header !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null);

  if (!update) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await handleTelegramUpdate(update);
  return NextResponse.json({ ok: true });
}
