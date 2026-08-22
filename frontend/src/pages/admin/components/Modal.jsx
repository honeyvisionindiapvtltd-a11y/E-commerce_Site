export default function Modal({ open = false, title = '', onClose = () => {}, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-500">Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
