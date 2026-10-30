import { clearConflictingAddressRecords } from "./dns/clear-conflicting-address-records.js";

function sanitize(message: string, secrets: readonly string[]): string {
  let text = message;
  for (const secret of secrets) {
    if (secret.length === 0) continue;
    text = text.split(secret).join("[redacted]");
  }
  return text;
}

const token = process.env.CLOUDFLARE_API_TOKEN ?? "";
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";

try {
  await clearConflictingAddressRecords({
    token,
    accountId,
    log: (line) => console.log(line),
  });
} catch (error) {
  const message = error instanceof Error ? error.message : "DNS cleanup failed";
  console.error(sanitize(message, [token, accountId]));
  process.exit(1);
}
