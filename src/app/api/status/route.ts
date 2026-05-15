/**
 * GET /api/status
 *
 * Lightweight introspection — returns which LLM provider and model
 * the server will use for the next call. Used by the /build chat UI
 * to label the header ("groq · llama-3.3-70b-versatile") so the user
 * always knows which brain is talking to them.
 */
import { NextResponse } from "next/server";
import { getProvider } from "@/builder/llm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  const provider = getProvider();
  return NextResponse.json({
    provider: provider.id,
    model: provider.model,
  });
}
