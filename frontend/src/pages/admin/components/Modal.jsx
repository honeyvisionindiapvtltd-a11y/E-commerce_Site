
import { X } from "lucide-react";
export default function Modal({open,title,onClose,children,wide=false}) {
  if(!open) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
    <div className={`w-full ${wide?"max-w-3xl":"max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
      <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
        <h2 className="text-sm font-bold">{title}</h2><button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={17}/></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
}
