import fs from "node:fs";
import path from "node:path";

function loadEnvFile(filepath) {
  if (!fs.existsSync(filepath)) {
    return;
  }

  const content = fs.readFileSync(filepath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not configured");
}

if (!webhookUrl) {
  throw new Error("TELEGRAM_WEBHOOK_URL is not configured");
}

const targetUrl = webhookUrl.endsWith("/api/telegram/webhook")
  ? webhookUrl
  : `${webhookUrl.replace(/\/$/, "")}/api/telegram/webhook`;

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: targetUrl,
    secret_token: secret || undefined,
    allowed_updates: ["message"],
  }),
});

const data = await response.json();

if (!response.ok || !data.ok) {
  throw new Error(`Failed to set webhook: ${JSON.stringify(data)}`);
}

console.log(`Webhook set to ${targetUrl}`);
