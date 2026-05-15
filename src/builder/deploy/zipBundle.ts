/**
 * zipBundle — turn a `{ filepath: content }` map into a zip Buffer.
 * Used by the /api/deploy?target=zip path so the user can download
 * the generated project and inspect / push / deploy it themselves.
 */
import JSZip from "jszip";

export async function zipFiles(
  files: Record<string, string>
): Promise<Buffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
