import { askLLM } from "@/lib/assistant-knowledge";
import { createLead } from "@/lib/db/repository";
import {
  clearTelegramSession,
  getTelegramSession,
  saveTelegramSession,
  type TelegramAssistantSession,
} from "@/lib/db/telegram-sessions";
import { notifyLead } from "@/lib/notify";
import type { LeadRecord } from "@/lib/types";

type TelegramMessage = {
  chat: { id: number };
  text?: string;
  from?: { first_name?: string; username?: string };
};

type TelegramUpdate = {
  message?: TelegramMessage;
};

const leadQuestions = [
  { key: "name", prompt: "Как вас зовут?" },
  { key: "role", prompt: "Какая у вас роль: собственник, менеджер, разработчик, маркетинг или другое?" },
  { key: "business", prompt: "Что это за бизнес или проект?" },
  {
    key: "audience",
    prompt: "Для кого делается решение: команда, клиенты, отдел продаж, внутренние специалисты?",
  },
  { key: "current_state", prompt: "Что происходит сейчас? Опишите текущий процесс или проблему." },
  { key: "goal", prompt: "Какой результат нужен? Что должно измениться после запуска?" },
  {
    key: "stack",
    prompt: "Какие сервисы уже используются? Например: Telegram, CRM, сайт, таблицы, API, 1С, Notion.",
  },
  { key: "timeline", prompt: "Есть ли желаемые сроки или дедлайн?" },
  { key: "contact", prompt: "Оставьте удобный контакт для связи: Telegram, email или телефон." },
] as const;

const startKeyboard = [["Оставить заявку", "Задать вопрос"], ["Сбросить диалог"]];

function buildWelcomeText() {
  return [
    "Я AI-ассистент Ainur.",
    "",
    "Могу помочь в двух режимах:",
    "1. Подсказать, какие решения можно собрать под вашу задачу.",
    "2. Собрать первоначальную информацию по проекту для заявки.",
    "",
    "Если хотите оставить заявку, я последовательно уточню:",
    "кто вы, для кого решение, что происходит сейчас, какой нужен результат и через какие каналы нужно связать систему.",
  ].join("\n");
}

function buildKeyboard(buttons: string[][]) {
  return {
    keyboard: buttons.map((row) => row.map((text) => ({ text }))),
    resize_keyboard: true,
    one_time_keyboard: false,
  };
}

async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: object) {
  const { TELEGRAM_BOT_TOKEN } = process.env;
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    }),
  });
}

function isQuestion(text: string) {
  const normalized = text.toLowerCase();
  return text.includes("?") || ["что", "как", "зачем", "сколько", "умеешь", "можно", "делаешь"].some((token) => normalized.includes(token));
}

function getCurrentQuestion(stepIndex: number) {
  return leadQuestions[stepIndex]?.prompt ?? null;
}

function buildLeadSummary(session: TelegramAssistantSession, message: TelegramMessage) {
  const answers = session.answers;
  const contact = answers.contact || (message.from?.username ? `@${message.from.username}` : `Telegram chat ${message.chat.id}`);

  return {
    name: answers.name || message.from?.first_name || "Имя не указано",
    company: answers.business || "Не указано",
    telegram_or_email: contact,
    project_summary: [
      `Роль: ${answers.role || "не указано"}`,
      `Для кого: ${answers.audience || "не указано"}`,
      `Что происходит сейчас: ${answers.current_state || "не указано"}`,
      `Какой результат нужен: ${answers.goal || "не указано"}`,
      `Текущий стек: ${answers.stack || "не указано"}`,
      `Сроки: ${answers.timeline || "не указано"}`,
    ].join("\n\n"),
    budget_range: "Нужно обсудить",
    consent: true as const,
    website: "",
  };
}

async function completeLead(session: TelegramAssistantSession, message: TelegramMessage) {
  const leadPayload = buildLeadSummary(session, message);
  const saved = await createLead(leadPayload, `telegram:${message.chat.id}`, "telegram-assistant:v1");

  const leadRecord: LeadRecord = {
    id: saved.id,
    name: saved.name,
    company: saved.company,
    telegram_or_email: saved.telegramOrEmail,
    project_summary: saved.projectSummary,
    budget_range: saved.budgetRange,
    consent: saved.consent === "true",
    website: "",
    source: saved.source,
    ip_hash: saved.ipHash,
    created_at: saved.createdAt,
  };

  await notifyLead(leadRecord);
  await clearTelegramSession(String(message.chat.id));

  await sendTelegramMessage(
    message.chat.id,
    "Спасибо. Я собрал первоначальную информацию по проекту и передал заявку дальше. Если хотите, можете ещё задать вопрос по решениям, которые можно собрать.",
    buildKeyboard(startKeyboard),
  );
}

async function handleLeadMode(session: TelegramAssistantSession, message: TelegramMessage, text: string) {
  if (isQuestion(text)) {
    const kbAnswer = await askLLM(text);
    await sendTelegramMessage(
      message.chat.id,
      `${kbAnswer}\n\nПродолжим заявку.\n${getCurrentQuestion(session.stepIndex)}`,
    );
    return;
  }

  const current = leadQuestions[session.stepIndex];
  if (!current) {
    await completeLead(session, message);
    return;
  }

  session.answers[current.key] = text;
  session.stepIndex += 1;
  await saveTelegramSession(session);

  const nextQuestion = getCurrentQuestion(session.stepIndex);
  if (!nextQuestion) {
    await completeLead(session, message);
    return;
  }

  await sendTelegramMessage(message.chat.id, nextQuestion);
}

async function handleQuestionMode(message: TelegramMessage, text: string) {
  const kbAnswer = await askLLM(text);

  await sendTelegramMessage(
    message.chat.id,
    `${kbAnswer}\n\nЕсли хотите, можете задать ещё вопрос или перейти к заявке.`,
    buildKeyboard(startKeyboard),
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  const text = message?.text?.trim();

  if (!message || !text) {
    return;
  }

  const chatId = String(message.chat.id);

  if (text === "/start" || text === "Сбросить диалог") {
    await clearTelegramSession(chatId);
    await sendTelegramMessage(message.chat.id, buildWelcomeText(), buildKeyboard(startKeyboard));
    return;
  }

  if (text === "Оставить заявку") {
    const session: TelegramAssistantSession = {
      chatId,
      mode: "lead",
      stepIndex: 0,
      answers: {},
    };
    await saveTelegramSession(session);
    await sendTelegramMessage(
      message.chat.id,
      `Начнём с базового.\n\n${leadQuestions[0].prompt}`,
      buildKeyboard([["Сбросить диалог"]]),
    );
    return;
  }

  if (text === "Задать вопрос") {
    const session: TelegramAssistantSession = {
      chatId,
      mode: "question",
      stepIndex: 0,
      answers: {},
    };
    await saveTelegramSession(session);
    await sendTelegramMessage(
      message.chat.id,
      "Напишите вопрос. Я отвечу по встроенной базе знаний о сервисах, форматах работы и том, с чего лучше начать.",
      buildKeyboard(startKeyboard),
    );
    return;
  }

  const session =
    (await getTelegramSession(chatId)) ??
    ({
      chatId,
      mode: "welcome",
      stepIndex: 0,
      answers: {},
    } satisfies TelegramAssistantSession);

  if (session.mode === "lead") {
    await handleLeadMode(session, message, text);
    return;
  }

  await handleQuestionMode(message, text);
}
