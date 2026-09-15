import { login } from "@/app/actions";

export default function LoginPage() {
  return <div className="grid min-h-screen place-items-center bg-gradient-to-br from-emerald-50 to-slate-100 p-4 dark:from-emerald-950 dark:to-slate-950"><div className="card w-full max-w-md p-8 text-center"><div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-600 text-xl font-bold text-white">SW</div><h1 className="text-2xl font-bold">Welcome to Smart Wallet</h1><p className="mt-2 text-sm text-slate-500">Private access for the configured Google account.</p><form action={login} className="mt-7"><button className="btn-primary w-full">Continue with Google</button></form><p className="mt-4 text-xs text-slate-400">No public registration is available.</p></div></div>;
}
