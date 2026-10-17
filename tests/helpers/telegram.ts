import { createHash, createHmac } from "node:crypto";

// Test-only values (never real secrets).
export const TEST_BOT_TOKEN = "123456:test-bot-token-not-real";
export const TEST_WEBHOOK_SECRET = "test-webhook-secret-0123456789";

/** Headers Telegram sends on a webhook call registered with secret_token. */
export const TG_WEBHOOK_HEADERS = {
  "Content-Type": "application/json",
  "X-Telegram-Bot-Api-Secret-Token": TEST_WEBHOOK_SECRET,
};

/** Adds the bot token + webhook secret to a test env. */
export function tgEnv<T extends Record<string, unknown>>(env: T): any {
  return { TELEGRAM_BOT_TOKEN: TEST_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET, ...env };
}

function stableId(seed: string): number {
  return 100000 + (parseInt(createHash("sha256").update(seed).digest("hex").slice(0, 8), 16) % 900000000);
}

/** Produce Telegram Login Widget data signed like Telegram does (key = SHA256(bot token)). */
export function signTelegramLogin(
  fields: Record<string, string | number | undefined>,
  botToken = TEST_BOT_TOKEN,
  authDate = Math.floor(Date.now() / 1000)
): Record<string, string | number> {
  const data: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) data[k] = v;
  if (data.id === undefined) data.id = stableId(String(data.username ?? data.first_name ?? "user"));
  if (data.auth_date === undefined) data.auth_date = authDate;
  const checkString = Object.keys(data).sort().map((k) => `${k}=${data[k]}`).join("\n");
  const key = createHash("sha256").update(botToken).digest();
  data.hash = createHmac("sha256", key).update(checkString).digest("hex");
  return data;
}
