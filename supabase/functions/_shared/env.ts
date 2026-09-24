/**
 * Fail-closed secrets (JCAI-FIX-06/C4, L3-10 / S8).
 *
 * Call at module top level so a missing secret stops the function at cold
 * start with a clear message, instead of surfacing later as `undefined` inside
 * a URL, a key, or an Authorization header.
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Set it with: supabase secrets set ${name}=...`);
  }
  return value;
}
