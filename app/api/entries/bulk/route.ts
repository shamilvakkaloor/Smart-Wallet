import { auth } from "@/lib/auth";
// Protect old browser sessions that still show bulk deletion.
export async function DELETE() {
 if (!(await auth())?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
 return Response.json({ error: "Bulk deletion has been disabled. Refresh the Entries page." }, { status: 410 });
}
