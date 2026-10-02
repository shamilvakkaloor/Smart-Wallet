export default function Loading() {
  return <div role="status" aria-label="Loading page" className="space-y-6"><span className="sr-only">Loading your wallet…</span><div className="skeleton h-8 w-56"/><div className="skeleton h-4 w-72 max-w-full"/><div className="grid gap-5 sm:grid-cols-2"><div className="card h-60"><div className="skeleton mb-7 h-10 w-10"/><div className="skeleton h-9 w-48"/></div><div className="card h-60"><div className="skeleton mb-7 h-10 w-10"/><div className="skeleton h-9 w-48"/></div></div><div className="skeleton h-64 w-full"/></div>;
}
