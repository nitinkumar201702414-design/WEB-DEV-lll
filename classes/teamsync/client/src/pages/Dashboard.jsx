import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { Badge, EmptyState, ErrorBox, PRIORITY_STYLE, PROJECT_STATUS_STYLE, STATUS_LABEL, STATUS_STYLE, Spinner, StatCard, errMsg, fmtDate, fmtDateTime } from "../components/ui";

function Panel({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { notifTick } = useRealtime();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  // Reload when a live notification arrives so numbers stay fresh.
  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data.data)).catch((e) => setError(errMsg(e)));
  }, [notifTick]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Spinner />;
  const s = data.stats;

  if (data.role === "admin") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Registered users" value={s.users} />
          <StatCard label="Projects" value={s.projects} />
          <StatCard label="Tasks" value={s.total} />
          <StatCard label="Pending" value={s.pending} tone="text-slate-600" />
          <StatCard label="In progress" value={s.inProgress} tone="text-amber-600" />
          <StatCard label="Completed" value={s.completed} tone="text-teal-700" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Recently created projects">
            {data.recentProjects.length === 0 ? <EmptyState text="No projects yet." /> : (
              <ul className="divide-y divide-slate-100">
                {data.recentProjects.map((p) => (
                  <li key={p._id} className="flex items-center justify-between py-2.5">
                    <Link to={`/projects/${p._id}`} className="font-medium hover:text-teal-700">{p.name}</Link>
                    <span className="flex items-center gap-3 text-xs text-slate-500">Ends {fmtDate(p.endDate)}<Badge className={PROJECT_STATUS_STYLE[p.status]}>{p.status}</Badge></span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Recently assigned tasks">
            {data.recentTasks.length === 0 ? <EmptyState text="No tasks yet." /> : (
              <ul className="divide-y divide-slate-100">
                {data.recentTasks.map((t) => (
                  <li key={t._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0"><p className="truncate font-medium">{t.title}</p><p className="text-xs text-slate-500">{t.assignedTo?.name} in {t.project?.name}</p></div>
                    <Badge className={STATUS_STYLE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">You have {s.pending + s.inProgress} open task{s.pending + s.inProgress === 1 ? "" : "s"} and {data.unread} unread notification{data.unread === 1 ? "" : "s"}.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="My projects" value={s.projects} />
        <StatCard label="My tasks" value={s.total} />
        <StatCard label="Pending" value={s.pending} tone="text-slate-600" />
        <StatCard label="In progress" value={s.inProgress} tone="text-amber-600" />
        <StatCard label="Completed" value={s.completed} tone="text-teal-700" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming deadlines">
          {data.upcoming.length === 0 ? <EmptyState text="Nothing due soon." /> : (
            <ul className="divide-y divide-slate-100">
              {data.upcoming.map((t) => (
                <li key={t._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0"><p className="truncate font-medium">{t.title}</p><p className="text-xs text-slate-500">{t.project?.name}</p></div>
                  <span className="flex items-center gap-2 text-xs text-slate-600">{fmtDate(t.deadline)}<Badge className={PRIORITY_STYLE[t.priority]}>{t.priority}</Badge></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent notifications">
          {data.notifications.length === 0 ? <EmptyState text="No notifications yet." /> : (
            <ul className="divide-y divide-slate-100">
              {data.notifications.map((n) => (
                <li key={n._id} className="py-2.5"><p className={`text-sm ${n.isRead ? "text-slate-600" : "font-semibold"}`}>{n.message}</p><p className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</p></li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
