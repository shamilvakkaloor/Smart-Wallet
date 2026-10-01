import { apiError } from "@/lib/api-error";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createExchange, createNormalEntry, createTransfer } from "@/services/transaction-service";

export async function POST(request: Request) {
  if (!(await auth())?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const result = body.type === "TRANSFER" ? await createTransfer(body) : body.type === "EXCHANGE" ? await createExchange(body) : await createNormalEntry(body);
    revalidatePath("/", "layout");
    return NextResponse.json({ id: result.id, reference: result.reference }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: apiError(error) }, { status: 400 });
  }
}
