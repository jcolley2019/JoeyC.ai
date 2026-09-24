/**
 * CORS for the Studio's edge functions (JCAI-FIX-06/C3, L3-08).
 *
 * Only the site's own origins get an Access-Control-Allow-Origin header. Any
 * other origin gets no ACAO at all, so a browser on a third-party page cannot
 * read the response (no wildcard, no fallback origin). Server-to-server calls
 * send no Origin and are unaffected — CORS is a browser rule, auth still lives
 * in each function.
 *
 * contact-form keeps its own narrower copy (POST only, www only).
 */
const ALLOWED_ORIGINS = new Set<string>([
  "https://www.joeyc.ai",
  "https://joeyc.ai",
  "http://localhost:5173",
]);

export const ALLOWED_HEADERS = "authorization, x-client-info, apikey, content-type";

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
