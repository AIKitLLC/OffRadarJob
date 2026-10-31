export const RETRY_AFTER_SECONDS = 30;

const PAGE = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Temporarily unavailable | AI Kit</title>
<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#fafafa;color:#1a1a1a;display:grid;place-items:center;min-height:100vh}main{max-width:32rem;padding:2rem;text-align:center}a{color:#0b57d0}</style>
</head>
<body><main><h1>We'll be right back</h1><p>This page is temporarily unavailable. Please try again in a minute.</p><p><a href="/">Reload</a></p></main></body>
</html>
`;

/** Static 503 page for any upstream failure or timeout. Never includes error details. */
export function gatewayFailureResponse(): Response {
  return new Response(PAGE, {
    status: 503,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      "retry-after": String(RETRY_AFTER_SECONDS),
      "x-robots-tag": "noindex",
    },
  });
}

export function reportGatewayFailure(error: unknown): void {
  const name = error instanceof Error ? error.name : "Error";
  console.error(JSON.stringify({ event: "edge_proxy_request_failed", name }));
}
