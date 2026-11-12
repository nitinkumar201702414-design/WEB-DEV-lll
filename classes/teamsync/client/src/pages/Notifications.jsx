import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useRealtime } from "../context/RealtimeContext";
import { EmptyState, Pagination, Spinner, btnGhost, errMsg, fmtDateTime } from "../components/ui";
import { useToast } from "../context/ToastContext";

export default function Notifications() {
  const { notifTick, reloadNotifications, unreadCount } = useRealtime();
  const toast = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    api.get("/notifications", { params: { page, limit: 10 } })
      .then((r) => { setItems(r.data.data); setPagination(r.data.pagination); })
      .catch((e) => toast(errMsg(e), "error"));
  }, [page]);

  useEffect(() => { load(); }, [load, notifTick]); // notifTick: new live notification => reload

  const open = async (n) => {
    if (!n.isRead) { await api.patch(`/notifications/${n._id}/read`).catch(() => {}); load(); reloadNotifications(); }
    if (n.relatedProject) navigate(`/projects/${n.relatedProject}`);
  };
  const markAll = async () => { await api.patch("/notifications/read-all"); load(); reloadNotifications(); };

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications <span className="text-base font-normal text-slate-500">({unreadCount} unread)</span></h1>
        <button className={btnGhost} onClick={markAll} disabled={unreadCount === 0}>Mark all as read</button>
      </div>
      {!items ? <Spinner /> : items.length === 0 ? <EmptyState text="No notifications yet. Task assignments and project updates will show up here." /> : (
        <>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {items.map((n) => (
              <li key={n._id}>
                <button onClick={() => open(n)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 ${n.isRead ? "" : "bg-teal-50/60"}`}>
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-teal-600"}`} />
                  <span><span className={`block text-sm ${n.isRead ? "text-slate-600" : "font-semibold text-slate-900"}`}>{n.message}</span><span className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}
    </div>
  );
}
