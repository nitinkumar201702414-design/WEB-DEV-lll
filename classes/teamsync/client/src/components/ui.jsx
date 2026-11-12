import { useEffect } from "react";

// ---- shared class names ----
export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors";
export const btnSmall = "rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50";

// ---- labels and colours ----
export const STATUS_LABEL = { pending: "Pending", "in-progress": "In Progress", completed: "Completed" };
export const STATUS_STYLE = {
  pending: "bg-slate-200 text-slate-700",
  "in-progress": "bg-amber-100 text-amber-800",
  completed: "bg-teal-100 text-teal-800",
};
export const PRIORITY_STYLE = { low: "bg-sky-100 text-sky-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-700" };
export const PROJECT_STATUS_STYLE = {
  planning: "bg-slate-200 text-slate-700", active: "bg-teal-100 text-teal-800",
  "on-hold": "bg-amber-100 text-amber-800", completed: "bg-indigo-100 text-indigo-800",
};

// ---- helpers ----
export const errMsg = (err) => err?.response?.data?.message || err?.message || "Something went wrong";
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "-");
export const fmtDateTime = (d) => new Date(d).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const isOverdue = (task) => task.status !== "completed" && new Date(task.deadline) < new Date(new Date().setHours(0, 0, 0, 0));

// ---- small components ----
export function Spinner({ className = "" }) {
  return (
    <div className={`flex justify-center py-10 ${className}`} role="status" aria-label="Loading">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" />
    </div>
  );
}

export function Badge({ className = "", children }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>{children}</span>;
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{message}</div>;
}

export function EmptyState({ text, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
      <p>{text}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, tone = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 font-display text-3xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>Page {pagination.page} of {pagination.pages} ({pagination.total} total)</span>
      <div className="flex gap-2">
        <button className={btnGhost} disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>Previous</button>
        <button className={btnGhost} disabled={pagination.page >= pagination.pages} onClick={() => onPage(pagination.page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Modal({ open, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl ${wide ? "sm:max-w-2xl" : "sm:max-w-md"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Close">&#10005;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmText = "Delete", busy, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className={btnGhost} onClick={onCancel}>Cancel</button>
        <button className={btnDanger} onClick={onConfirm} disabled={busy}>{busy ? "Working..." : confirmText}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
