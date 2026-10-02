export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h1 className="text-[28px] font-semibold leading-tight tracking-[-.035em]">{title}</h1>{description && <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>}</div>{actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}</header>;
}
