import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) return error.issues.map((issue) => issue.message).join(" ");
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") return "Another change happened at the same time. Please try again.";
    if (error.code === "P2002") return "That name already exists. Choose a different name.";
    if (error.code === "P2003") return "This item is still used by other records.";
    if (error.code === "P2025") return "This item no longer exists. Refresh the page.";
    return "The change could not be saved. Please refresh and try again.";
  }
  return error instanceof Error ? error.message : "The change could not be saved.";
}
