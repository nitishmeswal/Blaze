/**
 * Validation helpers shared between the streaming and non-streaming
 * routes. The route returns 502 on any failure here so the chat UI
 * can show the message inline. Every guard is hardened against
 * `null` / `undefined` / array-with-holes so a malicious or buggy
 * model output can't crash the server (devin-review BUG_0001 on PR #6).
 */
import { SITE_SPEC_VERSION, type SiteSpec } from "@/builder/types";

export interface AssistantPayload {
  explanation: string;
  spec: SiteSpec | null;
}

/**
 * Parse the model's raw text output (which should be a JSON object
 * matching AssistantPayload). Returns null if parsing or shape
 * validation fails. Strips an optional ```json … ``` fence — some
 * smaller models add one even when asked for raw JSON.
 */
export function parsePayload(raw: string): AssistantPayload | null {
  const stripped = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  let obj: unknown;
  try {
    obj = JSON.parse(stripped);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const candidate = obj as Partial<AssistantPayload>;
  if (typeof candidate.explanation !== "string") return null;
  if (
    candidate.spec !== null &&
    candidate.spec !== undefined &&
    (typeof candidate.spec !== "object" || Array.isArray(candidate.spec))
  ) {
    return null;
  }
  return {
    explanation: candidate.explanation,
    spec: (candidate.spec ?? null) as SiteSpec | null,
  };
}

/**
 * Type guard for SiteSpec. Hardened against arbitrary input — guards
 * each property access so a `null` / `undefined` element inside
 * `sections` cannot throw `TypeError: Cannot read properties of null`.
 */
export function isSiteSpec(s: unknown): s is SiteSpec {
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  const spec = s as Partial<SiteSpec>;
  if (spec.version !== SITE_SPEC_VERSION) return false;
  if (!spec.meta || typeof spec.meta !== "object") return false;
  if (typeof spec.meta.title !== "string") return false;
  if (!Array.isArray(spec.sections)) return false;
  return spec.sections.every(isSection);
}

function isSection(sec: unknown): boolean {
  if (!sec || typeof sec !== "object" || Array.isArray(sec)) return false;
  const s = sec as Record<string, unknown>;
  if (typeof s.id !== "string") return false;
  if (typeof s.componentId !== "string") return false;
  if (s.props === null || typeof s.props !== "object" || Array.isArray(s.props)) {
    return false;
  }
  // Optional background — if present, must be a recognised kind. We
  // reject the whole section rather than silently dropping the field
  // so the user sees the model's mistake in the chat error rather
  // than a half-broken preview.
  if (s.background !== undefined && !isSectionBackground(s.background)) {
    return false;
  }
  return true;
}

function isSectionBackground(bg: unknown): boolean {
  if (!bg || typeof bg !== "object" || Array.isArray(bg)) return false;
  const b = bg as Record<string, unknown>;
  if (b.kind !== "video") return false;
  if (typeof b.url !== "string" || b.url.length === 0) return false;
  // Optional fields — only reject if explicitly present with wrong type.
  if (b.poster !== undefined && typeof b.poster !== "string") return false;
  if (b.overlay !== undefined && typeof b.overlay !== "string") return false;
  if (
    b.opacity !== undefined &&
    (typeof b.opacity !== "number" || Number.isNaN(b.opacity))
  ) {
    return false;
  }
  if (b.fit !== undefined && b.fit !== "cover" && b.fit !== "contain") {
    return false;
  }
  if (b.loop !== undefined && typeof b.loop !== "boolean") return false;
  if (b.muted !== undefined && typeof b.muted !== "boolean") return false;
  if (b.autoplay !== undefined && typeof b.autoplay !== "boolean") return false;
  return true;
}
