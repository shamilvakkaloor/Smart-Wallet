import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { updateEntry, voidTransaction } from "@/services/transaction-service";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  if (!(await auth())?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    const entry = await updateEntry(id, await request.json());
    revalidatePath("/", "layout");
    return NextResponse.json({ id: entry.id });
  } catch (error) { return NextResponse.json({ error: apiError(error) }, { status: 400 }); }
}
export async function DELETE(_request: Request, context: Context) {
  if (!(await auth())?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    await voidTransaction(id);
    revalidatePath("/", "layout");
    return NextResponse.json({ id });
  } catch (error) { return NextResponse.json({ error: apiError(error) }, { status: 400 }); }
}
