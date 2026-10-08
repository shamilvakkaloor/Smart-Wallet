import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { previewImportCleanup, voidAllExcelImports } from "@/services/import-cleanup-service";
import { revalidatePath } from "next/cache";
export async function GET() {
 if (!(await auth())?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
 try { return Response.json(await previewImportCleanup(), { headers: { "Cache-Control": "no-store" } }); }
 catch (error) { return Response.json({ error: apiError(error) }, { status: 400 }); }
}
export async function DELETE(request: Request) {
 if (!(await auth())?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
 try { const result = await voidAllExcelImports(await request.json()); revalidatePath("/", "layout"); return Response.json(result); }
 catch (error) { return Response.json({ error: apiError(error) }, { status: 400 }); }
}
