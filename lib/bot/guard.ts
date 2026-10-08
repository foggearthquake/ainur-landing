/* Cheap checks around the model: attacks are refused before any call, leaks are cut after it. */
import { randomUUID } from "node:crypto";

// one per deployment; if it ever shows up in an answer, the prompt is leaking
export const CANARY = `cnr-${randomUUID().slice(0, 8)}`;

const ATTACKS = [
  /игнорир\S*\s+(все\s+)?(предыдущ|прошл|инструкц|правил)/i,
  /(забудь|отмени|сбрось)\s+(все\s+)?(свои\s+)?(инструкц|правил|настройк)/i,
  /(покажи|выведи|раскрой|повтори|напиши)\s+(мне\s+)?(свой\s+|свои\s+|твой\s+|твои\s+)?(системн\S*\s+)?(промпт|инструкц|правила)/i,
  /(системн\S*|system)\s*(промпт|prompt|message|сообщени)/i,
  /ignore\s+(all\s+)?(the\s+)?(previous|prior|above)/i,
  /\b(jailbreak|developer mode|DAN mode)\b/i,
  /<\/?(system|assistant|im_start|im_end)>|\[\/?INST\]/i,
  /(притворись|веди себя как|представь,?\s+что\s+ты\s+(не\s+)?(бот|ии|модель))/i,
  /\b(act|pretend)\s+as\b/i,
];

const ZERO_WIDTH = /[​-‏⁠﻿]/g;

export function cleanInput(text: string) {
  return text.normalize("NFC").replace(ZERO_WIDTH, "").replace(/\s+/g, " ").trim().slice(0, 2000);
}

export const isAttack = (text: string) => ATTACKS.some((re) => re.test(text));

/* Telegram gets plain text here: models love **bold** and # headers, which arrive as literal symbols. */
export function cleanOutput(text: string | null): string | null {
  if (!text) return null;
  if (text.includes(CANARY) || /(системн\S*\s+промпт|system prompt|\[INST\])/i.test(text)) return null;
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}
