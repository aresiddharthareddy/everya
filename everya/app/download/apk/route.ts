import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const file = await readFile(path.join(process.cwd(), "public", "EVERYA-offline.apk"));
  return new Response(file, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="EVERYA-offline.apk"',
      "Content-Length": String(file.byteLength),
    },
  });
}
