import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return new Response("Unauthorized", { status: 401 });
  const row = await db.attachment.findUnique({ where: { id: (await params).id } });
  if (!row) return new Response("Not found", { status: 404 });
  try { const root = path.resolve(process.env.UPLOAD_DIR ?? "./uploads"); const file = await readFile(path.join(root, path.basename(row.storagePath))); return new Response(file, { headers: { "Content-Type": row.mimeType, "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.fileName)}`, "Cache-Control": "private, no-store" } }); } catch { return new Response("Stored file is missing", { status: 404 }); }
}
