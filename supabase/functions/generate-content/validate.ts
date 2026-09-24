/**
 * Request validation for generate-content (JCAI-FIX-06/C1, L3-17).
 *
 * Every field that ends up inside a prompt is either an enum or length-capped,
 * so a caller cannot smuggle instructions through input_type/platform or run
 * up a max-size call with an unbounded body. brand_context is deliberately NOT
 * accepted from the body: the function reads the caller's brand profile itself.
 */

export const INPUT_TYPES = ["youtube", "text", "voice"] as const;
export const OUTPUT_FORMATS = ["social", "blog", "thread", "video"] as const;
export const PLATFORMS = ["tiktok", "instagram", "pinterest", "linkedin", "youtube", "x"] as const;

export const MAX_INPUT_CHARS = 30_000; // input_text and cascade_source
export const MAX_HASHTAG_CHARS = 4_000; // real_time_hashtags

export type InputType = typeof INPUT_TYPES[number];
export type OutputFormat = typeof OUTPUT_FORMATS[number];
export type Platform = typeof PLATFORMS[number];

export interface GenerateRequest {
  input_type: InputType;
  input_text: string;
  output_format: OutputFormat;
  platform?: Platform;
  cascade_source?: string;
  real_time_hashtags?: string;
  /** Present on every call of one Studio button press; absent from old clients. */
  batch_id?: string;
}

export type ValidationResult =
  | { ok: true; value: GenerateRequest }
  | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === "string" && (list as readonly string[]).includes(v);

export function validateRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;

  if (!isOneOf(OUTPUT_FORMATS, b.output_format)) {
    return { ok: false, error: `output_format must be one of: ${OUTPUT_FORMATS.join(", ")}` };
  }

  // Derivative calls from older clients omit input_type; they were stored as "text".
  const inputType = b.input_type ?? (b.cascade_source ? "text" : undefined);
  if (!isOneOf(INPUT_TYPES, inputType)) {
    return { ok: false, error: `input_type must be one of: ${INPUT_TYPES.join(", ")}` };
  }

  if (b.platform !== undefined && b.platform !== null && !isOneOf(PLATFORMS, b.platform)) {
    return { ok: false, error: `platform must be one of: ${PLATFORMS.join(", ")}` };
  }

  for (const [field, max] of [
    ["input_text", MAX_INPUT_CHARS],
    ["cascade_source", MAX_INPUT_CHARS],
    ["real_time_hashtags", MAX_HASHTAG_CHARS],
  ] as const) {
    const v = b[field];
    if (v === undefined || v === null) continue;
    if (typeof v !== "string") return { ok: false, error: `${field} must be a string` };
    if (v.length > max) {
      return { ok: false, error: `${field} is too long (${v.length.toLocaleString("en-US")} characters; max ${max.toLocaleString("en-US")})` };
    }
  }

  const cascadeSource = typeof b.cascade_source === "string" && b.cascade_source.trim() ? b.cascade_source : undefined;
  const inputText = typeof b.input_text === "string" ? b.input_text : "";
  if (!cascadeSource && !inputText.trim()) {
    return { ok: false, error: "input_text is required" };
  }

  if (b.batch_id !== undefined && b.batch_id !== null && (typeof b.batch_id !== "string" || !UUID_RE.test(b.batch_id))) {
    return { ok: false, error: "batch_id must be a UUID" };
  }

  return {
    ok: true,
    value: {
      input_type: inputType,
      input_text: inputText,
      output_format: b.output_format,
      platform: (b.platform ?? undefined) as Platform | undefined,
      cascade_source: cascadeSource,
      real_time_hashtags: typeof b.real_time_hashtags === "string" && b.real_time_hashtags ? b.real_time_hashtags : undefined,
      batch_id: (b.batch_id ?? undefined) as string | undefined,
    },
  };
}
