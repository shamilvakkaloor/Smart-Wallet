import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { createCategory, renameCategory, deleteCategory } from "@/services/category-service";

async function mutate(request: Request, operation: "create" | "rename" | "delete") {
  if (!(await auth())?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const { kind } = z.object({ kind: z.enum(["normal", "debt"]) }).parse(body);
    const id = operation === "create" ? "" : z.string().min(1).parse(body.id);
    const result = operation === "create" ? await createCategory(kind, body) : operation === "rename" ? await renameCategory(kind, id, body) : await deleteCategory(kind, id);
    revalidatePath("/", "layout");
    return NextResponse.json(result, { status: operation === "create" ? 201 : 200 });
  } catch (error) { return NextResponse.json({ error: apiError(error) }, { status: 400 }); }
}
export const POST = (request: Request) => mutate(request, "create");
export const PATCH = (request: Request) => mutate(request, "rename");
export const DELETE = (request: Request) => mutate(request, "delete");
