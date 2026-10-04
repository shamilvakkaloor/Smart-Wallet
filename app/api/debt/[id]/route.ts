import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { updateDebtEntry, voidDebtEntry } from "@/services/debt-service";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const entry = await updateDebtEntry(id, await request.json());
    revalidatePath("/", "layout");
    return NextResponse.json({ id: entry.id });
  } catch (error) { return NextResponse.json({ error: apiError(error) }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await voidDebtEntry(id, await request.json());
    revalidatePath("/", "layout");
    return NextResponse.json({ id });
  } catch (error) { return NextResponse.json({ error: apiError(error) }, { status: 400 }); }
}
