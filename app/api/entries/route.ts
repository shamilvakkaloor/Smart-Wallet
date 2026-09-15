import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExchange, createNormalEntry, createTransfer } from "@/services/transaction-service";

export async function POST(request: Request) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const result = body.type === "TRANSFER" ? await createTransfer(body) : body.type === "EXCHANGE" ? await createExchange(body) : await createNormalEntry(body);
    return NextResponse.json({ id: result.id, reference: result.reference }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save entry." }, { status: 400 });
  }
}
