import { X } from "lucide-react";

export default function Modal({ open, onClose, title, icon: Icon, children, wide }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative mt-4 w-full rounded-[24px] border border-slate-200 bg-white shadow-2xl sm:mt-8 ${wide ? "max-w-5xl" : "max-w-2xl"}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
