import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import api from "../api/axios";
import { fmtDateTime } from "./ui";

function NotificationBell() {
  const { unreadCount, latest, reloadNotifications } = useRealtime();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const openItem = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      await api.patch(`/notifications/${n._id}/read`).catch(() => {});
      reloadNotifications();
    }
    if (n.relatedProject) navigate(`/projects/${n.relatedProject}`);
  };
  const markAll = async () => {
    await api.patch("/notifications/read-all").catch(() => {});
    reloadNotifications();
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="font-semibold">Notifications</p>
              {unreadCount > 0 && <button onClick={markAll} className="text-xs font-medium text-teal-700 hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {latest.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-500">You're all caught up.</p>}
              {latest.map((n) => (
                <button key={n._id} onClick={() => openItem(n)} className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${n.isRead ? "" : "bg-teal-50/60"}`}>
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{fmtDateTime(n.createdAt)}</p>
                </button>
              ))}
            </div>
            <button onClick={() => { setOpen(false); navigate("/notifications"); }} className="block w-full bg-slate-50 px-4 py-2.5 text-center text-sm font-medium text-teal-700 hover:bg-slate-100">
              View all notifications
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const isAdmin = user.role === "admin";

  const links = [
    [isAdmin ? "/admin" : "/dashboard", "Dashboard"],
    ...(isAdmin ? [["/users", "User Management"]] : []),
    ["/projects", "Projects"],
    ["/tasks", "Tasks"],
    ["/notifications", "Notifications"],
    ["/profile", "Profile"],
  ];
  const linkCls = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-teal-500/20 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen lg:flex">
      {menu && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setMenu(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#10222b] p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}>
        <p className="px-3 py-4 font-display text-2xl font-bold text-white">TeamSync</p>
        <nav className="flex-1 space-y-1" onClick={() => setMenu(false)}>
          {links.map(([to, label]) => <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>)}
        </nav>
        <div className="border-t border-white/10 pt-4">
          <p className="truncate px-3 text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate px-3 text-xs capitalize text-slate-400">{user.role}</p>
          <button onClick={handleLogout} className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white">Logout</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur lg:justify-end lg:px-8">
          <button className="rounded p-2 text-slate-600 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
