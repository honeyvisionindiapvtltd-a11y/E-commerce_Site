import React from 'react'

export default function PageHeader({ title, description, action = null }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold">{title}</h1>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
