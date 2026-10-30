export function gatewayFailureResponse(): Response {
  return new Response("Bad Gateway", {
    status: 502,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export function reportGatewayFailure(error: unknown): void {
  const name = error instanceof Error ? error.name : "Error";
  const message = error instanceof Error ? error.message : "unknown failure";
  console.error(JSON.stringify({ event: "edge_proxy_request_failed", name, message }));
}
