/* @foggearthquake_bot — two modes in one bot:
   1) ainur. services: answers by the knowledge base, a 2-step request, «Позвать Айнура» (live handover);
   2) a demo dental clinic: booking by buttons, free text or voice, my bookings, reschedule / cancel,
      a sample reminder, questions to the clinic, handover to an administrator.
   The owner (TELEGRAM_CHAT_ID) answers clients by replying to the bot's notifications. */
import { SALES_PROMPT, answerFromKeywords } from "@/lib/assistant-knowledge";
import * as C from "@/lib/bot/clinic";
import { CANARY, cleanInput, cleanOutput, isAttack } from "@/lib/bot/guard";
import { chat, transcribe } from "@/lib/bot/llm";
import {
  admit,
  cancelBooking,
  createBooking,
  futureBookings,
  getBooking,
  getChat,
  moveBooking,
  saveChat,
  type ChatState,
  type Flow,
} from "@/lib/bot/store";
import {
  answerCallback,
  downloadFile,
  edit,
  esc,
  send,
  tg,
  typing,
  type Keyboard,
  type TgMessage,
  type TgUpdate,
  type TgUser,
} from "@/lib/bot/telegram";
import { createLead } from "@/lib/db/repository";
import { addChatMessage, clearChatHistory, getChatHistory } from "@/lib/db/telegram-sessions";
import { notifyLead } from "@/lib/notify";

type Ctx = { chatId: string; user?: TgUser; state: ChatState; msgId?: number };
type BookFlow = Extract<Flow, { kind: "book" }>;

const ADMIN = () => process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
const PRIVACY = "https://gabdra.pw/privacy";

const b = (text: string, data: string) => ({ text, callback_data: data });

const MAIN: Keyboard = [
  [b("Демо: бот записи в клинику", "demo")],
  [b("Услуги и цены", "svc"), b("Оставить заявку", "lead")],
  [b("Как устроен бот", "how"), b("Позвать Айнура", "human")],
];
const DEMO: Keyboard = [
  [b("Записаться", "d:book"), b("Мои записи", "d:my")],
  [b("Вопрос клинике", "d:ask"), b("Позвать администратора", "d:human")],
  [b("Как это устроено", "how"), b("Выйти из демо", "menu")],
];
const AFTER_SALES: Keyboard = [[b("Оставить заявку", "lead"), b("Позвать Айнура", "human")], [b("Меню", "menu")]];
const AFTER_DEMO: Keyboard = [[b("Записаться", "d:book"), b("Меню демо", "demo")]];

const hello = (u?: TgUser) =>
  `Привет${u?.first_name ? `, ${esc(u.first_name)}` : ""}! Я ассистент <b>ainur.</b> Айнур делает сайты, ботов и AI-системы для бизнеса.\n\n` +
  "Спроси что угодно — текстом или голосовым. А лучше сразу попробуй демо: бот записи для клиники. Так же он может работать и у тебя.";

const DEMO_TEXT =
  `<b>Демо: стоматология ${C.CLINIC}</b>\nКлиника вымышленная, бот настоящий. Попробуйте как пациент — кнопками, текстом или голосовым.\n\n` +
  "Например: <i>«хочу на чистку в пятницу после обеда»</i> или <i>«сколько стоит отбеливание?»</i>";

const SERVICES_TEXT =
  "<b>Сайты</b> — продающий сайт под ключ: 10–15 тыс. ₽, готов за 5–7 дней. Сначала бесплатный макет за 1–2 дня, после сдачи — 2 правки бесплатно. site.gabdra.pw\n\n" +
  "<b>AI-системы</b> — боты и ассистенты по вашей базе знаний, запись и заявки, поиск по документам, автоматизация рутины, голос. " +
  "Бот с парой интеграций — от 15 тыс. ₽, связка с CRM — от 30 тыс. ₽, поиск по документам — от 50 тыс. ₽. ai.gabdra.pw\n\n" +
  "Первый разговор бесплатный. Спроси что угодно — отвечу.";

/* compressed, in general words: what the bot does, not how it is wired */
const HOW_TEXT =
  "<b>Как устроен этот бот</b>\n" +
  "• Понимает обычный текст и голосовые: сам разбирает, чего хочет человек — записаться, перенести, спросить.\n" +
  "• Запись и перенос — кнопками по живому расписанию. Время проверяется в момент записи, двойная запись исключена.\n" +
  "• Отвечает по базе знаний бизнеса: цены и условия — из прайса, а не из головы нейросети.\n" +
  "• Защищён от попыток «сломать» ИИ и не раскрывает внутренние настройки.\n" +
  "• Жалоба, сложный вопрос или «позовите человека» — диалог сразу уходит администратору, бот замолкает.\n" +
  "• Персональные данные — бережно: согласие перед записью и только нужный минимум.\n\n" +
  "Под ваш бизнес добавляется: WhatsApp и VK, напоминания о визите, отзывы после приёма, возврат постоянных клиентов, CRM и админка с аналитикой.";

const LEAD_TYPES: Record<string, string> = { site: "Сайт", bot: "Бот или ассистент", auto: "Автоматизация", other: "Другое" };

const who = (u?: TgUser) => `${esc(u?.first_name ?? "Без имени")}${u?.username ? ` @${esc(u.username)}` : ""}`;
const histKey = (ctx: Ctx) => `${ctx.chatId}:${ctx.state.mode === "demo" ? "demo" : "sales"}`;

async function setFlow(ctx: Ctx, flow: Flow, mode = ctx.state.mode) {
  ctx.state.flow = flow;
  ctx.state.mode = mode;
  await saveChat(ctx.state);
}

/* ── handover: the bot goes quiet, the owner answers by replying to the notification ── */

async function handover(ctx: Ctx, reason?: string) {
  const demo = ctx.state.mode === "demo";
  if (!ADMIN()) {
    await send(ctx.chatId, "Сейчас не могу позвать человека — напиши Айнуру на ainur@gabdra.pw.");
    return;
  }
  const last = (await getChatHistory(histKey(ctx)))
    .slice(-4)
    .map((m) => `${m.role === "user" ? "—" : "бот:"} ${m.content.slice(0, 200)}`)
    .join("\n");
  ctx.state.manual = true;
  await setFlow(ctx, { kind: "none" });
  await send(
    ADMIN(),
    `<b>Зовут тебя</b> · ${demo ? "демо клиники" : "услуги"}\n${who(ctx.user)} · id:${ctx.chatId}` +
      (reason ? `\nСообщение: ${esc(reason.slice(0, 300))}` : "") +
      (last ? `\n\n${esc(last)}` : "") +
      `\n\nОтветь реплаем на это сообщение — ответ уйдёт клиенту. Вернуть бота: кнопка или /bot ${ctx.chatId}`,
    [[b("Вернуть бота", `a:r:${ctx.chatId}`)]],
  );
  await edit(
    ctx.chatId,
    ctx.msgId,
    (demo
      ? "Передал администратору — в демо это Айнур, он ответит прямо здесь."
      : "Позвал Айнура — он ответит прямо здесь, обычно в течение пары часов (ночью — утром).") +
      " Пока он на связи, я молчу.\n\nВернуться к боту — /start",
  );
}

async function resume(chatId: string) {
  const st = await getChat(chatId);
  st.manual = false;
  await saveChat(st);
  await send(chatId, "Бот снова на связи. Чем помочь?", st.mode === "demo" ? DEMO : MAIN);
  await send(ADMIN(), `Бот вернулся к id:${chatId}.`);
}

/* owner's messages: "/bot <id>" or a reply to a notification carrying id:<chat> */
async function ownerMessage(msg: TgMessage): Promise<boolean> {
  if (!ADMIN() || String(msg.chat.id) !== ADMIN()) return false;
  const text = msg.text?.trim() ?? "";
  const direct = /^\/bot\s+(-?\d+)/.exec(text);
  if (direct) {
    await resume(direct[1]);
    return true;
  }
  const ref = msg.reply_to_message;
  const id = /id:(-?\d+)/.exec(ref?.text ?? ref?.caption ?? "")?.[1];
  if (!id) return false; // the owner is just using the bot like anyone else
  if (/^\/bot\b/.test(text)) {
    await resume(id);
    return true;
  }
  if (text) await send(id, `<b>Айнур:</b> ${esc(text)}`);
  else await tg("copyMessage", { chat_id: id, from_chat_id: msg.chat.id, message_id: msg.message_id });
  const st = await getChat(id);
  if (!st.manual) {
    st.manual = true;
    st.flow = { kind: "none" };
    await saveChat(st);
    await send(ADMIN(), `Отправлено. Пока не вернёшь бота, он у этого клиента молчит: /bot ${id}`);
  }
  return true;
}

/* ── ainur. services ── */

async function salesAnswer(ctx: Ctx, text: string) {
  if (ctx.state.mode !== "sales") await setFlow(ctx, { kind: "none" }, "sales");
  await typing(ctx.chatId);
  const key = histKey(ctx);
  const history = await getChatHistory(key);
  const raw = await chat([{ role: "system", content: SALES_PROMPT(CANARY) }, ...history, { role: "user", content: text }], {
    maxTokens: 350,
    temperature: 0.5,
  });
  const reply = cleanOutput(raw) ?? answerFromKeywords(text);
  await addChatMessage(key, "user", text);
  await addChatMessage(key, "assistant", reply);
  await send(ctx.chatId, esc(reply), AFTER_SALES);
}

async function leadStart(ctx: Ctx, type?: string) {
  if (type) {
    await setFlow(ctx, { kind: "lead", step: "task", type }, ctx.state.mode === "demo" ? "demo" : "sales");
    await edit(ctx.chatId, ctx.msgId, leadTaskText(type));
    return;
  }
  await setFlow(ctx, { kind: "none" }, "sales");
  await edit(
    ctx.chatId,
    ctx.msgId,
    `Пара вопросов — и Айнур свяжется.\n\n<b>Что нужно?</b>\n\n<i>Отвечая, ты соглашаешься на обработку данных по <a href="${PRIVACY}">политике</a>.</i>`,
    [
      [b(LEAD_TYPES.site, "l:t:site"), b(LEAD_TYPES.bot, "l:t:bot")],
      [b(LEAD_TYPES.auto, "l:t:auto"), b(LEAD_TYPES.other, "l:t:other")],
    ],
  );
}

const leadTaskText = (type: string) =>
  `<b>${esc(type)}</b> — понял. Опиши задачу в паре фраз: что за бизнес и что должно измениться. Можно голосовым.`;

/* the request reaches the owner right after the task — the contact question is optional */
async function leadSubmit(ctx: Ctx, task: string, type: string) {
  const contact = `Telegram${ctx.user?.username ? ` @${ctx.user.username}` : ""} · id:${ctx.chatId}`;
  const saved = await createLead(
    {
      name: ctx.user?.first_name || "Без имени",
      company: type,
      telegram_or_email: contact,
      project_summary: task,
      budget_range: "Нужно обсудить",
      consent: true,
      website: "",
    },
    `telegram:${ctx.chatId}`,
    "telegram-bot:v2",
  );
  await notifyLead({
    id: saved.id,
    name: saved.name,
    company: saved.company,
    telegram_or_email: saved.telegramOrEmail,
    project_summary: saved.projectSummary,
    budget_range: saved.budgetRange,
    consent: true,
    website: "",
    source: saved.source,
    ip_hash: saved.ipHash,
    created_at: saved.createdAt,
  });
  await setFlow(ctx, { kind: "lead", step: "contact", type });
  await send(ctx.chatId, "Заявка у Айнура. Ответить тебе здесь, в Telegram?", [
    [b("Да, пишите сюда", "l:c:tg"), b("Дам другой контакт", "l:c:other")],
  ]);
}

/* ── demo clinic ── */

const DEMO_ROUTER = () => {
  const today = C.todayIso();
  return `Классифицируй сообщение пациента стоматологии. Верни только JSON:
{"intent":"booking|my_bookings|reschedule|cancel|question|human|other","service":"consult|hygiene|caries|whitening|kids|null","date":"YYYY-MM-DD|null","part":"morning|afternoon|evening|null"}
Услуги: consult — консультация, осмотр; hygiene — чистка, гигиена, налёт, камень; caries — кариес, пломба, лечить зуб; whitening — отбеливание; kids — ребёнок, детский приём.
booking — хочет записаться или прийти; my_bookings — спрашивает про свои записи; reschedule — перенести визит; cancel — отменить визит; human — просит живого человека или администратора, жалоба, претензия, возврат денег; question — вопрос о ценах, услугах, подготовке, оплате, боли; other — приветствие или не про клинику.
Сегодня ${today}, ${C.weekdayName(today)}. «В пятницу» — ближайшая будущая пятница, «завтра» — от сегодня. part: утро до 12, день 12–17, вечер после 17. Если параметр не назван — null.`;
};

type Route = { intent?: string; service?: string | null; date?: string | null; part?: string | null };

async function demoRoute(ctx: Ctx, text: string) {
  const raw = await chat(
    [
      { role: "system", content: DEMO_ROUTER() },
      { role: "user", content: text },
    ],
    { json: true, maxTokens: 120, temperature: 0 },
  );
  let r: Route = {};
  try {
    r = JSON.parse(raw ?? "{}") as Route;
  } catch {
    /* fall through to a consultation */
  }
  const service = r.service && C.SERVICES[r.service] ? r.service : undefined;
  const day = r.date && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.date >= C.todayIso() ? r.date : undefined;
  const part = r.part === "morning" || r.part === "afternoon" || r.part === "evening" ? r.part : undefined;
  if (r.intent === "booking") return bookStart(ctx, { service, day, part });
  if (r.intent === "my_bookings" || r.intent === "reschedule" || r.intent === "cancel")
    return showMy(ctx, r.intent === "reschedule" ? "Какую запись перенести?" : r.intent === "cancel" ? "Какую запись отменить?" : undefined);
  if (r.intent === "human") return handover(ctx, text);
  return clinicAnswer(ctx, text);
}

async function clinicAnswer(ctx: Ctx, text: string) {
  await typing(ctx.chatId);
  const key = histKey(ctx);
  const history = await getChatHistory(key);
  const raw = await chat([{ role: "system", content: C.clinicPrompt(CANARY) }, ...history, { role: "user", content: text }], {
    maxTokens: 300,
    temperature: 0.4,
  });
  const reply = cleanOutput(raw) ?? "Уточню у администратора. Хотите — передам вопрос человеку или запишу вас на бесплатную консультацию.";
  await addChatMessage(key, "user", text);
  await addChatMessage(key, "assistant", reply);
  await send(ctx.chatId, esc(reply), AFTER_DEMO);
}

const card = (service: string, doctor: string, start: string, patient?: string) => {
  const s = C.SERVICES[service];
  return (
    `${esc(s.name)} · ${s.min} мин · ${s.price}\nВрач: ${esc(C.DOCTORS[doctor]?.name ?? doctor)}\nКогда: ${C.when(start)}` +
    (patient ? `\nПациент: ${esc(patient)}` : "")
  );
};

async function bookStart(ctx: Ctx, pre: { service?: string; day?: string; part?: BookFlow["part"] } = {}) {
  const flow: BookFlow = { kind: "book", step: "service", ...pre };
  if (pre.service) {
    flow.step = "doctor";
    const docs = C.doctorsFor(pre.service);
    if (docs.length === 1) {
      flow.doctor = docs[0];
      flow.step = "day";
    }
  }
  return bookRender(ctx, flow);
}

/* one renderer per step; the same message is edited as the patient clicks through */
async function bookRender(ctx: Ctx, f: BookFlow, note = ""): Promise<void> {
  await setFlow(ctx, f, "demo");
  const head = (f.resched ? `<b>Перенос записи № D-${f.resched}</b>\n` : "") + (note ? `${note}\n\n` : "");
  const show = (text: string, kb?: Keyboard) => edit(ctx.chatId, ctx.msgId, head + text, kb);

  if (f.step === "service") {
    await show(
      "Выберите услугу:",
      [...Object.entries(C.SERVICES).map(([k, s]) => [b(`${s.name} · ${s.price}`, `d:s:${k}`)]), [b("Назад", "demo")]],
    );
    return;
  }
  const service = f.service!;
  if (f.step === "doctor") {
    await show(`<b>${esc(C.SERVICES[service].name)}</b>\nКто примет?`, [
      ...C.doctorsFor(service).map((k) => [b(`${C.DOCTORS[k].short} — ${C.DOCTORS[k].role}`, `d:dr:${k}`)]),
      [b("Любой свободный врач", "d:dr:any")],
      [b("Назад", "d:book")],
    ]);
    return;
  }
  const doctor = f.doctor ?? "any";
  if (f.step === "day") {
    // a day named in free text goes straight to its times when it has room
    if (f.day && (await C.freeSlots(service, doctor, f.day, f.part)).length) return bookRender(ctx, { ...f, step: "time", page: 0 });
    const missed = f.day ? `На ${C.dayLong(f.day)} ${f.part ? "в это время " : ""}свободных окон нет — ближайшие дни:\n` : "";
    const days = await C.freeDays(service, doctor, 6, C.todayIso(), f.part);
    if (!days.length) {
      await show("Свободных окон на две недели нет. Позвать администратора?", [[b("Позвать администратора", "d:human")], [b("Меню демо", "demo")]]);
      return;
    }
    const rows: Keyboard = [];
    for (let i = 0; i < days.length; i += 3) rows.push(days.slice(i, i + 3).map((d) => b(C.dayShort(d), `d:dy:${d}`)));
    await show(`${missed}<b>${esc(C.SERVICES[service].name)}</b>${doctor !== "any" ? ` · ${esc(C.DOCTORS[doctor].short)}` : ""}\nВыберите день:`, [
      ...rows,
      [b("Назад", f.resched ? "d:my" : `d:s:${service}`)],
    ]);
    return;
  }
  if (f.step === "time") {
    let slots = await C.freeSlots(service, doctor, f.day!, f.part);
    if (!slots.length && f.part) slots = await C.freeSlots(service, doctor, f.day!);
    if (!slots.length) return bookRender(ctx, { ...f, day: undefined, part: undefined, step: "day" }, "На этот день мест не осталось.");
    const page = f.page ?? 0;
    const shown = slots.slice(page * 8, page * 8 + 8);
    const rows: Keyboard = [];
    for (let i = 0; i < shown.length; i += 4)
      rows.push(shown.slice(i, i + 4).map((s) => b(s.time, `d:tm:${s.time.replace(":", "")}:${s.doctor}`)));
    const nav = [];
    if (page > 0) nav.push(b("Раньше", `d:pg:${page - 1}`));
    if (slots.length > (page + 1) * 8) nav.push(b("Позже", `d:pg:${page + 1}`));
    if (nav.length) rows.push(nav);
    rows.push([b("Другой день", "d:dd")]);
    const who = doctor !== "any" ? ` · ${esc(C.DOCTORS[doctor].short)}` : "";
    await show(`${esc(C.SERVICES[service].name)}${who}\n<b>${C.dayLong(f.day!)}</b> — свободное время:`, rows);
    return;
  }
  const start = `${f.day}T${f.time}`;
  if (f.step === "name") {
    const kb: Keyboard = ctx.user?.first_name ? [[b(`Записать как «${ctx.user.first_name.slice(0, 20)}»`, "d:nm")]] : [];
    await show(
      `${card(service, doctor, start)}\n\n<b>Как вас записать?</b> Напишите имя.\n<i>Продолжая, вы соглашаетесь на обработку данных для записи. В демо храним только имя; в рабочем боте здесь — телефон.</i>`,
      [...kb, [b("Другое время", "d:dd")]],
    );
    return;
  }
  // confirm
  await show(`<b>${f.resched ? "Перенести на это время?" : "Проверьте запись"}</b>\n${card(service, doctor, start, f.name)}`, [
    [b(f.resched ? "Перенести" : "Подтвердить", "d:ok"), b("Другое время", "d:dd")],
    [b("Отменить", "demo")],
  ]);
}

async function bookConfirm(ctx: Ctx) {
  const f = ctx.state.flow as BookFlow;
  if (f.kind !== "book" || f.step !== "confirm" || !f.service || !f.doctor || !f.day || !f.time) return showDemo(ctx);
  const start = `${f.day}T${f.time}`;
  const min = C.SERVICES[f.service].min;
  const cells = C.cellsOf(start, min);
  const end = C.endOf(start, min);
  if (f.resched) {
    const live = await getBooking(ctx.chatId, f.resched);
    if (!live || live.status !== "confirmed") return showMy(ctx);
    const ok = await moveBooking(ctx.chatId, f.resched, start, end, f.doctor, cells);
    if (!ok) return bookRender(ctx, { ...f, step: "time", page: 0 }, "Это время только что заняли — выберите другое.");
    await setFlow(ctx, { kind: "none" });
    await edit(ctx.chatId, ctx.msgId, `<b>Перенесли</b> № D-${f.resched}\n${card(f.service, f.doctor, start)}\n\nНапоминания пересчитаны.`, [
      [b("Мои записи", "d:my"), b("Меню демо", "demo")],
    ]);
    return;
  }
  const id = await createBooking({ chatId: ctx.chatId, service: f.service, doctor: f.doctor, start, end, patient: f.name ?? "Пациент" }, cells);
  if (!id) return bookRender(ctx, { ...f, step: "time", page: 0 }, "Это время только что заняли — выберите другое.");
  await setFlow(ctx, { kind: "none" });
  await edit(
    ctx.chatId,
    ctx.msgId,
    `<b>Записали!</b> № D-${id}\n${card(f.service, f.doctor, start, f.name)}\n\nНапомню за сутки и за 2 часа до визита. В демо напоминание можно посмотреть сразу.`,
    [
      [b("Показать напоминание", `d:rm:${id}`), b("Мои записи", "d:my")],
      [b("Хочу такого бота", "l:demo"), b("Меню демо", "demo")],
    ],
  );
}

async function showMy(ctx: Ctx, title?: string) {
  await setFlow(ctx, { kind: "none" }, "demo");
  const list = await futureBookings(ctx.chatId, C.nowKey());
  if (!list.length) {
    await edit(ctx.chatId, ctx.msgId, "Записей пока нет.", [[b("Записаться", "d:book"), b("Меню демо", "demo")]]);
    return;
  }
  const lines = list.map((x) => `№ D-${x.id} · ${C.when(x.start)}\n${esc(C.SERVICES[x.service]?.name ?? x.service)} · ${esc(C.DOCTORS[x.doctor]?.short ?? x.doctor)}`);
  await edit(ctx.chatId, ctx.msgId, `<b>${title ?? "Ваши записи"}</b>\n\n${lines.join("\n\n")}`, [
    ...list.map((x) => [b(`Перенести D-${x.id}`, `d:mv:${x.id}`), b(`Отменить D-${x.id}`, `d:cx:${x.id}`)]),
    [b("Записаться", "d:book"), b("Меню демо", "demo")],
  ]);
}

async function rescheduleStart(ctx: Ctx, id: number) {
  const bk = await getBooking(ctx.chatId, id);
  if (!bk || bk.status !== "confirmed") return showMy(ctx);
  if (C.minutesToVisit(bk.start) < 120) {
    await edit(ctx.chatId, ctx.msgId, "До визита меньше 2 часов — перенос только через администратора.", [
      [b("Позвать администратора", "d:human"), b("Мои записи", "d:my")],
    ]);
    return;
  }
  if (bk.reschedules >= 3) {
    await edit(ctx.chatId, ctx.msgId, "Эту запись уже переносили 3 раза — дальше через администратора.", [
      [b("Позвать администратора", "d:human"), b("Мои записи", "d:my")],
    ]);
    return;
  }
  return bookRender(ctx, { kind: "book", step: "day", service: bk.service, doctor: bk.doctor, name: bk.patient, resched: id });
}

async function showDemo(ctx: Ctx) {
  await setFlow(ctx, { kind: "none" }, "demo");
  await edit(ctx.chatId, ctx.msgId, DEMO_TEXT, DEMO);
}

async function showMenu(ctx: Ctx) {
  await setFlow(ctx, { kind: "none" }, "menu");
  await edit(ctx.chatId, ctx.msgId, hello(ctx.user), MAIN);
}

/* ── buttons ── */

async function onCallback(ctx: Ctx, data: string, callbackId: string) {
  await answerCallback(callbackId);
  const [ns, a, c, d] = data.split(":");

  if (ns === "a" && a === "r" && c) {
    if (ADMIN() && ctx.chatId === ADMIN()) await resume(c);
    return;
  }
  if (data === "menu") return showMenu(ctx);
  if (data === "demo") return showDemo(ctx);
  if (data === "svc") {
    await setFlow(ctx, { kind: "none" }, "sales");
    return void (await edit(ctx.chatId, ctx.msgId, SERVICES_TEXT, [[b("Демо: бот записи в клинику", "demo")], ...AFTER_SALES]));
  }
  if (data === "how") {
    const demo = ctx.state.mode === "demo";
    return void (await edit(ctx.chatId, ctx.msgId, HOW_TEXT, [
      demo ? [b("Меню демо", "demo")] : [b("Попробовать демо", "demo"), b("Меню", "menu")],
    ]));
  }
  if (data === "human") {
    await setFlow(ctx, ctx.state.flow, ctx.state.mode === "demo" ? "sales" : ctx.state.mode);
    return handover(ctx);
  }
  if (data === "lead") return leadStart(ctx);
  if (ns === "l") {
    if (a === "t" && LEAD_TYPES[c]) return leadStart(ctx, LEAD_TYPES[c]);
    if (data === "l:demo") return leadStart(ctx, "Бот записи — после демо клиники");
    if (data === "l:c:tg") {
      await setFlow(ctx, { kind: "none" });
      return void (await edit(ctx.chatId, ctx.msgId, "Договорились — Айнур напишет сюда. Пока можешь посмотреть демо.", [
        [b("Демо: бот записи в клинику", "demo"), b("Меню", "menu")],
      ]));
    }
    if (data === "l:c:other") return void (await edit(ctx.chatId, ctx.msgId, "Напиши телефон или почту."));
    return;
  }
  if (ns !== "d") return;

  const f = ctx.state.flow.kind === "book" ? (ctx.state.flow as BookFlow) : null;
  switch (a) {
    case "book":
      return bookStart(ctx);
    case "my":
      return showMy(ctx);
    case "ask":
      await setFlow(ctx, { kind: "none" }, "demo");
      return void (await edit(ctx.chatId, ctx.msgId, "Спрашивайте: цены, подготовка, оплата, врачи — текстом или голосовым.", [[b("Меню демо", "demo")]]));
    case "human":
      await setFlow(ctx, { kind: "none" }, "demo");
      return handover(ctx);
    case "s":
      if (!C.SERVICES[c]) return;
      return bookStart(ctx, { service: c, day: f?.day, part: f?.part });
    case "dr":
      if (!f?.service || (c !== "any" && !C.DOCTORS[c])) return bookStart(ctx);
      return bookRender(ctx, { ...f, doctor: c, step: "day" });
    case "dy":
      if (!f?.service || !/^\d{4}-\d{2}-\d{2}$/.test(c)) return bookStart(ctx);
      return bookRender(ctx, { ...f, day: c, step: "time", page: 0 });
    case "dd":
      if (!f?.service) return bookStart(ctx);
      return bookRender(ctx, { ...f, day: undefined, part: undefined, step: "day" });
    case "pg":
      if (!f?.day) return bookStart(ctx);
      return bookRender(ctx, { ...f, step: "time", page: Math.max(0, Number(c) || 0) });
    case "tm": {
      if (!f?.service || !f.day || !/^\d{4}$/.test(c) || !C.DOCTORS[d]) return bookStart(ctx);
      const next: BookFlow = { ...f, time: `${c.slice(0, 2)}:${c.slice(2)}`, doctor: d, step: f.name ? "confirm" : "name" };
      return bookRender(ctx, next);
    }
    case "nm":
      if (!f?.time) return bookStart(ctx);
      return bookRender(ctx, { ...f, name: ctx.user?.first_name?.slice(0, 40) || "Пациент", step: "confirm" });
    case "ok":
      return bookConfirm(ctx);
    case "rm": {
      const bk = await getBooking(ctx.chatId, Number(c));
      if (!bk || bk.status !== "confirmed") return showMy(ctx);
      await send(
        ctx.chatId,
        `<b>Клиника ${C.CLINIC}</b>\nНапоминаем о визите: ${C.when(bk.start)} — ${esc(C.SERVICES[bk.service].name.toLowerCase())}, врач ${esc(C.DOCTORS[bk.doctor].short)}\n\nПридёте?`,
        [[b("Приду", `d:yes:${bk.id}`), b("Перенести", `d:mv:${bk.id}`)]],
      );
      return;
    }
    case "yes":
      return void (await edit(ctx.chatId, ctx.msgId, "Спасибо, ждём вас! Если планы поменяются — перенесите здесь же.\n<i>В рабочем боте администратор сразу видит подтверждение в расписании.</i>", [
        [b("Мои записи", "d:my"), b("Меню демо", "demo")],
      ]));
    case "mv":
      return rescheduleStart(ctx, Number(c));
    case "cx": {
      const bk = await getBooking(ctx.chatId, Number(c));
      if (!bk || bk.status !== "confirmed") return showMy(ctx);
      return void (await edit(ctx.chatId, ctx.msgId, `<b>Отменить запись № D-${bk.id}?</b>\n${card(bk.service, bk.doctor, bk.start)}`, [
        [b("Да, отменить", `d:cx2:${bk.id}`), b("Нет", "d:my")],
      ]));
    }
    case "cx2":
      if (!(await cancelBooking(ctx.chatId, Number(c)))) return showMy(ctx);
      await setFlow(ctx, { kind: "none" }, "demo");
      return void (await edit(ctx.chatId, ctx.msgId, "Запись отменена, время освобождено.", [[b("Записаться", "d:book"), b("Меню демо", "demo")]]));
  }
}

/* ── text (typed or transcribed) ── */

const STOP = /^(стоп|отмена|отменить|назад|выход|меню)$/i;
const HUMAN = /(живо\S* (человек|оператор)|позов\S* (человека|администратора|айнура)|соедин\S* с (человеком|администратором))/i;

async function onText(ctx: Ctx, text: string) {
  const f = ctx.state.flow;

  // "назад" / "человек" work on any step
  if (f.kind !== "none" && STOP.test(text)) return ctx.state.mode === "demo" ? showDemo(ctx) : showMenu(ctx);
  if (HUMAN.test(text)) return handover(ctx, text);

  if (f.kind === "lead" && f.step === "task") {
    if (text.length < 8) return void (await send(ctx.chatId, "Чуть подробнее, пожалуйста: что за бизнес и что должно измениться?"));
    return leadSubmit(ctx, text, f.type ?? "Не указано");
  }
  if (f.kind === "lead" && f.step === "contact") {
    await setFlow(ctx, { kind: "none" });
    await send(ADMIN(), `Контакт по заявке · ${who(ctx.user)} · id:${ctx.chatId}\n${esc(text.slice(0, 200))}`);
    return void (await send(ctx.chatId, "Записал. Айнур свяжется, как удобно тебе.", [[b("Демо: бот записи в клинику", "demo"), b("Меню", "menu")]]));
  }
  if (f.kind === "book" && f.step === "name") {
    if (text.length <= 40 && !text.includes("?")) return bookRender(ctx, { ...f, name: text, step: "confirm" });
    await clinicAnswer(ctx, text); // a question in the middle of a booking: answer, then continue
    return bookRender({ ...ctx, msgId: undefined }, f, "Продолжим запись.");
  }

  if (ctx.state.mode === "demo") return demoRoute(ctx, text);
  return salesAnswer(ctx, text);
}

/* ── entry ── */

const OLD_BUTTONS: Record<string, string> = { "Оставить заявку": "lead", "Задать вопрос": "svc", "Сбросить диалог": "/start" };

async function onMessage(msg: TgMessage) {
  const chatId = String(msg.chat.id);
  if (msg.chat.type && msg.chat.type !== "private") return;
  if (await ownerMessage(msg)) return;
  const ctx: Ctx = { chatId, user: msg.from, state: await getChat(chatId) };
  let text = cleanInput(msg.text ?? "");

  if (text.startsWith("/start") || text === "/menu" || OLD_BUTTONS[text] === "/start") {
    if (ctx.state.manual) await send(ADMIN(), `Клиент вернулся к боту · id:${chatId}`);
    ctx.state.manual = false;
    await clearChatHistory(`${chatId}:sales`);
    await clearChatHistory(`${chatId}:demo`);
    if (/^\/start\s+demo/.test(text)) {
      // deep link from the site: straight into the demo
      await setFlow(ctx, { kind: "none" }, "demo");
      return void (await send(chatId, DEMO_TEXT, DEMO));
    }
    // removes the reply keyboard left by the previous version of the bot
    await send(chatId, hello(msg.from), undefined, { reply_markup: { remove_keyboard: true } });
    await setFlow(ctx, { kind: "none" }, "menu");
    return void (await send(chatId, "Что посмотрим?", MAIN));
  }

  if (ctx.state.manual) {
    // a person is talking to this client: pass everything to the owner, stay silent
    const head = `${who(msg.from)} · id:${chatId}`;
    if (text) await send(ADMIN(), `${head}\n${esc(text)}`);
    else {
      await send(ADMIN(), `${head}\nприслал вложение ↓`);
      await tg("copyMessage", { chat_id: ADMIN(), from_chat_id: msg.chat.id, message_id: msg.message_id });
    }
    return;
  }

  if (text === "/demo") return showDemo(ctx);
  if (text === "/human") return handover(ctx);
  if (OLD_BUTTONS[text] === "lead") return leadStart(ctx);
  if (OLD_BUTTONS[text] === "svc") return void (await send(chatId, SERVICES_TEXT, AFTER_SALES));

  const voice = msg.voice ?? msg.audio;
  if (voice) {
    if (voice.duration > 120 || (voice.file_size ?? 0) > 4_000_000)
      return void (await send(chatId, "Голосовое — до 2 минут, пожалуйста. Или напишите текстом."));
    await typing(chatId);
    const audio = await downloadFile(voice.file_id);
    const heard = audio ? await transcribe(audio) : null;
    if (!heard) return void (await send(chatId, "Не разобрал голосовое — напишите, пожалуйста, текстом."));
    text = cleanInput(heard);
    await send(chatId, `<i>Распознал: «${esc(text)}»</i>`);
  }

  if (!text) {
    if (msg.photo || msg.document || msg.sticker || msg.video || msg.video_note)
      await send(chatId, "Пока понимаю текст и голосовые сообщения.");
    return;
  }
  if (text.length > 1500) return void (await send(chatId, "Слишком длинно — сократите, пожалуйста, до пары абзацев."));
  if (isAttack(text)) {
    return void (await send(
      chatId,
      ctx.state.mode === "demo"
        ? "Я помогаю с записью и вопросами о клинике. Чем могу помочь?"
        : "Я помогаю с задачами бизнеса — сайты, боты, AI-системы. Чем помочь?",
      ctx.state.mode === "demo" ? DEMO : MAIN,
    ));
  }
  return onText(ctx, text);
}

export async function handleTelegramUpdate(update: TgUpdate) {
  try {
    const cb = update.callback_query;
    const msg = update.message;
    const chatId = String(cb?.message?.chat.id ?? msg?.chat.id ?? "");
    if (!chatId || typeof update.update_id !== "number") return;

    const gate = await admit(update.update_id, chatId, cb ? "c" : "m");
    if (gate === "duplicate" || gate === "flood") return;
    if (gate === "flood-warn") return void (await send(chatId, "Слишком много сообщений подряд — подождите минуту."));

    if (cb) {
      const state = await getChat(chatId);
      if (state.manual && !cb.data?.startsWith("a:")) {
        await answerCallback(cb.id, "Сейчас с вами общается человек. Вернуться к боту — /start");
        return;
      }
      return onCallback({ chatId, user: cb.from, state, msgId: cb.message?.message_id }, cb.data ?? "", cb.id);
    }
    if (msg) return onMessage(msg);
  } catch (error) {
    // answer 200 anyway: a failing update must not make Telegram retry it forever
    console.error("bot update failed", error);
  }
}
