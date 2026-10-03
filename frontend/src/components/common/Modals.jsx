import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";

import { LoadingSpinner } from "./Feedback";

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ open, onClose, title, children, size = "md", footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className={`relative flex max-h-[90vh] w-full flex-col rounded-t-3xl bg-white shadow-card dark:bg-surface-dark sm:rounded-3xl ${SIZES[size]}`}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/5">
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4">{children}</div>
            {footer && <div className="border-t border-slate-100 px-5 py-4 dark:border-white/5">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${danger ? "bg-danger-50 text-danger-500 dark:bg-danger-900/30" : "bg-primary-50 text-primary-500 dark:bg-primary-900/30"}`}>
          <AlertTriangle size={22} />
        </span>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${
            danger ? "bg-danger-500 hover:bg-danger-600" : "bg-primary-500 hover:bg-primary-600"
          }`}
        >
          {loading && <LoadingSpinner size={16} />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
