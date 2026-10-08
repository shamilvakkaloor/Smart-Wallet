import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { voidTransactions } from "@/services/transaction-service";
import { revalidatePath } from "next/cache";
export async function DELETE(request: Request) {
  if (!(await auth())?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try { const result = await voidTransactions(await request.json()); revalidatePath("/", "layout"); return Response.json(result); }
  catch(error) { return Response.json({ error: apiError(error) }, { status: 400 }); }
}
