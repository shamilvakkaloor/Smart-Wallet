export function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return <span className={`brand-lockup ${inverse ? "text-white" : ""}`}><img src="/icons/wallet.svg" alt="SW" width={40} height={40} className="rounded-xl"/>{!compact && <span>Smart <span className={inverse ? "text-emerald-200" : "text-emerald-700 dark:text-emerald-300"}>Wallet</span><small className={`mt-0.5 block text-[8px] font-medium tracking-[.16em] ${inverse ? "text-emerald-200" : "text-muted"}`}>SW / PERSONAL FINANCE</small></span>}</span>;
}
