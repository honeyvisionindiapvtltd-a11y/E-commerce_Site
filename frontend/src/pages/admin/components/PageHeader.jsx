
export default function PageHeader({title, description, action, children}) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div><h1 className="text-xl font-bold">{title}</h1>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div>
    <div className="flex gap-2">{children}{action}</div>
  </div>
}
