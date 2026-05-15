/**
 * buildProject — given a `SiteSpec`, assemble a self-contained
 * Next.js project as a `{ filepath: content }` map. The map is the
 * payload for both target deploys (zip download + Vercel API).
 *
 * Runs server-side only (node:fs). Reads from the running Blaze
 * repo's filesystem; the function tracing config in `next.config.mjs`
 * ensures those files are included in the Vercel function bundle.
 */
import fs from "node:fs";
import path from "node:path";

import type { SiteSpec } from "@/builder/types";
import { CONFIG_FILES, RUNTIME_FILES } from "@/builder/deploy/manifest";
import {
  gitignoreFor,
  layoutTsxFor,
  nextConfigFor,
  packageJsonFor,
  pageTsxFor,
  readmeFor,
  tsconfigFor,
  vercelJsonFor,
} from "@/builder/deploy/templates";

export interface ProjectTree {
  /** Map of POSIX-style filepaths (relative to project root) → file contents. */
  files: Record<string, string>;
  /** Sanitised project name, suitable for a Vercel deployment name. */
  name: string;
}

/**
 * Returns the absolute path to the running Blaze repo. In dev this is
 * the cwd; in production (on Vercel), `process.cwd()` points to the
 * function bundle root which has the same layout.
 */
function repoRoot(): string {
  return process.cwd();
}

function readVerbatim(relPath: string): string {
  const abs = path.join(repoRoot(), relPath);
  return fs.readFileSync(abs, "utf8");
}

/**
 * Lowercase, dash-separated, alphanumeric. Vercel requires names to
 * match `^[a-z0-9]([a-z0-9-]*[a-z0-9])?$` (3..52 chars). Falls back
 * to "blaze-site" if the title produces an unusable slug.
 */
function slugify(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 40);
  if (cleaned.length < 3) return "blaze-site";
  return cleaned;
}

export function buildProject(spec: SiteSpec): ProjectTree {
  const files: Record<string, string> = {};

  // 1. Generated app shell
  files["app/layout.tsx"] = layoutTsxFor(spec);
  files["app/page.tsx"] = pageTsxFor(spec);
  files["README.md"] = readmeFor(spec);
  files["package.json"] = packageJsonFor();
  files["next.config.mjs"] = nextConfigFor();
  files["vercel.json"] = vercelJsonFor();
  files["tsconfig.json"] = tsconfigFor();
  files[".gitignore"] = gitignoreFor();

  // 2. Verbatim Blaze config files (Tailwind / PostCSS / globals.css)
  for (const relPath of CONFIG_FILES) {
    const destination =
      relPath === "src/app/globals.css" ? "app/globals.css" : relPath;
    files[destination] = readVerbatim(relPath);
  }

  // 3. The runtime — kit + builder render-time helpers, copied to
  //    the same paths so @/-aliased imports resolve identically.
  for (const relPath of RUNTIME_FILES) {
    files[relPath] = readVerbatim(relPath);
  }

  const titleSlug = slugify(spec.meta?.title ?? "blaze-site");
  const name = `${titleSlug}-${shortHash(spec)}`.slice(0, 52);
  return { files, name };
}

/**
 * Deterministic short hash of the spec — gives each deploy a unique
 * project name on Vercel without colliding when the same spec is
 * deployed twice in a row.
 */
function shortHash(spec: SiteSpec): string {
  const raw = JSON.stringify(spec);
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).slice(0, 6);
}
