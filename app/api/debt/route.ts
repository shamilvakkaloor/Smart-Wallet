import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDebtEntry } from "@/services/debt-service";

export async function POST(request: Request) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await createDebtEntry(await request.json());
    return NextResponse.json({ id: result.id, reference: result.reference }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save debt entry." }, { status: 400 });
  }
}
