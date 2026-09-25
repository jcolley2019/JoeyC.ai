import { createClient, type User } from "@supabase/supabase-js";
import { requireEnv } from "./env.ts";

const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");

export type RequireUserResult =
  | { ok: true; user: User; token: string }
  | { ok: false; response: Response };

/**
 * The same gate generate-content uses (L3-01): read the bearer token from the
 * Authorization header, verify it with supabase.auth.getUser(), and hand back a
 * ready-made 401 Response for anything that is not a real user session.
 *
 * The public anon key is a valid JWT but has no `sub` claim, so getUser()
 * rejects it — "verify_jwt = true" at the gateway is NOT enough on its own.
 *
 * Call this before parsing the request body and before any external call.
 */
export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<RequireUserResult> {
  const unauthorized = (error: string) => ({
    ok: false as const,
    response: new Response(JSON.stringify({ error }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }),
  });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized("No authorization header");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return unauthorized("No authorization header");
  }

  const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return unauthorized("Unauthorized");
  }

  return { ok: true, user, token };
}
