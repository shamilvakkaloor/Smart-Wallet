import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-emerald-50 to-slate-100 p-4 dark:from-emerald-950 dark:to-slate-950"><div className="card w-full max-w-md p-8 text-center"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">SW</div><h1 className="text-2xl font-bold">Welcome to Smart Wallet</h1><p className="mt-2 text-sm text-slate-500">Sign in with your user ID and password.</p><LoginForm /><p className="mt-4 text-xs text-slate-400">Your personal wallet. No public registration.</p></div></div>;
}
