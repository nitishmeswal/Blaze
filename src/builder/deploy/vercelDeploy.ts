/**
 * vercelDeploy — POSTs a built project tree to Vercel's deployment
 * API and returns the URL of the resulting preview.
 *
 * Vercel docs:
 *   https://vercel.com/docs/rest-api/reference/endpoints/deployments/create-a-new-deployment
 *
 * Requires `VERCEL_API_TOKEN` in the server environment. Without it
 * this function refuses the request — callers should fall back to
 * the zip path.
 */

export interface VercelDeployResult {
  /** Final URL with https:// prefix. */
  url: string;
  /** Vercel deployment ID, e.g. dpl_AbCdEf… */
  id: string;
  /** Current readiness state when the API returned. */
  readyState: string;
}

export class VercelDeployError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface VercelDeploymentFile {
  file: string;
  data: string;
  encoding?: "utf-8" | "base64";
}

interface VercelCreateDeploymentResponse {
  id?: string;
  url?: string;
  readyState?: string;
  error?: { code: string; message: string };
}

export async function deployToVercel(args: {
  name: string;
  files: Record<string, string>;
  teamId?: string;
}): Promise<VercelDeployResult> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) {
    throw new VercelDeployError(
      "VERCEL_API_TOKEN not configured on the server.",
      500,
      "no-token"
    );
  }

  const vercelFiles: VercelDeploymentFile[] = Object.entries(args.files).map(
    ([file, data]) => ({ file, data, encoding: "utf-8" })
  );

  const url = args.teamId
    ? `https://api.vercel.com/v13/deployments?teamId=${encodeURIComponent(args.teamId)}`
    : "https://api.vercel.com/v13/deployments";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: args.name,
      files: vercelFiles,
      projectSettings: { framework: "nextjs" },
      target: "production",
    }),
  });

  const bodyText = await res.text();
  if (!res.ok) {
    throw new VercelDeployError(
      `Vercel API ${res.status}: ${res.statusText}`,
      res.status,
      bodyText
    );
  }

  let payload: VercelCreateDeploymentResponse;
  try {
    payload = JSON.parse(bodyText) as VercelCreateDeploymentResponse;
  } catch {
    throw new VercelDeployError(
      "Vercel API returned non-JSON response",
      res.status,
      bodyText
    );
  }

  if (payload.error) {
    throw new VercelDeployError(
      payload.error.message,
      res.status,
      JSON.stringify(payload.error)
    );
  }
  if (!payload.id || !payload.url) {
    throw new VercelDeployError(
      "Vercel API response missing id or url",
      res.status,
      bodyText
    );
  }

  return {
    id: payload.id,
    url: payload.url.startsWith("http") ? payload.url : `https://${payload.url}`,
    readyState: payload.readyState ?? "QUEUED",
  };
}
