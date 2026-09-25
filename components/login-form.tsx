"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(login, "");
  return <form action={action} className="mt-7 space-y-4 text-left">
    <div><label htmlFor="username">User ID</label><input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={200} required /></div>
    <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" maxLength={1024} required /></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}
    <button disabled={pending} className="btn-primary w-full">{pending ? "Signing in…" : "Sign in"}</button>
  </form>;
}
