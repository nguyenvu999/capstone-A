import { AlertTriangle, X } from "lucide-react"

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-[#5b655d] transition hover:opacity-70"
        >
          <X size={18} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={22} />
        </div>

        <h2 className="mt-4 text-2xl font-bold text-[#001910]">{title}</h2>
        <p className="mt-3 leading-7 text-[#5b655d]">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-[#d8dfcf] px-5 py-3 text-sm font-medium text-[#355e1d] transition hover:bg-[#f4f8ee] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-5 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#355e1d] hover:bg-[#2d4f18]"
            }`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}