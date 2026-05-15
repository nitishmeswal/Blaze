/**
 * POST /api/deploy
 *
 * Body:
 *   { spec: SiteSpec, target: "zip" | "vercel" }
 *
 * target="zip"     → returns application/zip stream of the built project.
 * target="vercel"  → POSTs to Vercel's deployments API and returns
 *                    { url, id } JSON.
 *
 * Phase 4 of the Blaze builder roadmap. Compiles a declarative
 * `SiteSpec` into a self-contained Next.js project and ships it.
 */
import { NextRequest, NextResponse } from "next/server";

import { buildProject } from "@/builder/deploy/buildProject";
import {
  VercelDeployError,
  deployToVercel,
} from "@/builder/deploy/vercelDeploy";
import { zipFiles } from "@/builder/deploy/zipBundle";
import { isSiteSpec } from "@/builder/validate";
import type { SiteSpec } from "@/builder/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DeployRequestBody {
  spec?: SiteSpec;
  target?: "zip" | "vercel";
}

export async function POST(req: NextRequest) {
  let body: DeployRequestBody;
  try {
    body = (await req.json()) as DeployRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body.spec) {
    return NextResponse.json(
      { error: "Request must include `spec`." },
      { status: 400 }
    );
  }
  if (!isSiteSpec(body.spec)) {
    return NextResponse.json(
      { error: "`spec` is not a valid SiteSpec." },
      { status: 400 }
    );
  }

  const target: "zip" | "vercel" =
    body.target === "vercel" || body.target === "zip"
      ? body.target
      : "vercel";

  let project: ReturnType<typeof buildProject>;
  try {
    project = buildProject(body.spec);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Failed to assemble project tree from spec.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }

  if (target === "zip") {
    let buf: Buffer;
    try {
      buf = await zipFiles(project.files);
    } catch (err) {
      return NextResponse.json(
        {
          error: "Failed to bundle project as zip.",
          detail: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      );
    }
    // NextResponse's BodyInit doesn't accept Node Buffer directly,
    // and TS's stricter view-buffer types don't accept a slice ref
    // either. Copy into a fresh ArrayBuffer-backed Uint8Array so the
    // type-checker is satisfied.
    const bytes = new Uint8Array(buf.byteLength);
    bytes.set(buf);
    const blob = new Blob([bytes], { type: "application/zip" });
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.name}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // target === "vercel"
  if (!process.env.VERCEL_API_TOKEN) {
    return NextResponse.json(
      {
        error:
          "Vercel deploy is not configured on this server (VERCEL_API_TOKEN missing). Use target=zip to download the project instead.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await deployToVercel({
      name: project.name,
      files: project.files,
      teamId: process.env.VERCEL_TEAM_ID || undefined,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof VercelDeployError) {
      return NextResponse.json(
        {
          error: err.message,
          status: err.status,
          detail: err.body,
        },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 }
      );
    }
    return NextResponse.json(
      {
        error: "Unexpected error deploying to Vercel.",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
