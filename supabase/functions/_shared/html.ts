/**
 * Escape a user-supplied value for interpolation into HTML (L3-11 / S5).
 * Covers the five characters that matter in text and attribute context.
 * Always call this before putting anything from a request body into an email
 * or any other HTML string. Non-strings are stringified; null/undefined → "".
 */
const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(input: unknown): string {
  const s = input == null ? "" : String(input);
  return s.replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}
