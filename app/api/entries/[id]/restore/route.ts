import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { restoreTransaction } from "@/services/transaction-service";
import { revalidatePath } from "next/cache";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
 if (!(await auth())?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
 try {
  const { id } = await params;
  const result = await restoreTransaction(id, await request.json());
  revalidatePath("/", "layout"); return Response.json(result);
 } catch (error) { return Response.json({ error: apiError(error) }, { status: 400 }); }
}
