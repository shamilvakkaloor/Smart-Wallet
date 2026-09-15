import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await request.formData(); const file = form.get("file"); const transactionId = String(form.get("transactionId") ?? "") || null; const debtTransactionId = String(form.get("debtTransactionId") ?? "") || null;
    if (!(file instanceof File) || (!transactionId && !debtTransactionId) || (transactionId && debtTransactionId)) throw new Error("Choose a file and exactly one related record.");
    const max = Number(process.env.MAX_UPLOAD_MB ?? 5) * 1024 * 1024;
    if (!allowedTypes.has(file.type) || file.size > max) throw new Error(`Use JPG, PNG, WebP, or PDF up to ${process.env.MAX_UPLOAD_MB ?? 5} MB.`);
    if (transactionId && !(await db.transaction.findUnique({ where: { id: transactionId }, select: { id: true } }))) throw new Error("Transaction not found.");
    const uploadRoot = path.resolve(process.env.UPLOAD_DIR ?? "./uploads"); await mkdir(uploadRoot, { recursive: true });
    const extension = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 8); const storedName = `${crypto.randomUUID()}${extension}`; const absolute = path.join(uploadRoot, storedName);
    await writeFile(absolute, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    const row = await db.attachment.create({ data: { transactionId, debtTransactionId, fileName: path.basename(file.name), storagePath: storedName, mimeType: file.type, fileSize: file.size } });
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 }); }
}
