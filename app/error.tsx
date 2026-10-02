"use client";
import Link from "next/link";
import { TriangleAlert, RotateCcw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="card mx-auto max-w-lg text-center"><TriangleAlert size={30} className="mx-auto mb-4 text-amber-600"/><h1 className="text-2xl font-semibold tracking-tight">This page couldn’t load</h1><p className="mt-3 text-sm leading-relaxed text-muted">Please try again. If it keeps happening, check the application logs for details.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button className="btn-primary" onClick={reset}><RotateCcw size={16}/>Try again</button><Link href="/" className="btn-secondary">Go to Home</Link></div></section>;
}
