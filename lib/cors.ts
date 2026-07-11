// Extension endpoints are reachable cross-origin from the browser extension's
// pages, so they need explicit CORS headers. They're gated by bearer-token
// auth (see requireApiToken), which is the actual security boundary — the
// wildcard origin here just lets the extension's fetch() succeed.
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
