import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { useToast } from "../context/ToastContext";
import useDebounce from "../utils/useDebounce";
import TaskForm from "./TaskForm";
import {
  Badge, ConfirmDialog, EmptyState, ErrorBox, Pagination, Spinner,
  STATUS_LABEL, STATUS_STYLE, PRIORITY_STYLE, btnGhost, btnPrimary, btnSmall, errMsg, fmtDate, inputCls, isOverdue,
} from "./ui";

const COLUMNS = [
  ["pending", "Pending", "border-t-slate-400"],
  ["in-progress", "In Progress", "border-t-amber-400"],
  ["completed", "Completed", "border-t-teal-500"],
];

function StatusSelect({ task, onChange }) {
  return (
    <select className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs" value={task.status} onChange={(e) => onChange(task, e.target.value)} aria-label="Change status">
      {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function TaskCard({ task, onStatus, isAdmin, onEdit, onDelete }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task._id)}
      className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
        <Badge className={PRIORITY_STYLE[task.priority]}>{task.priority}</Badge>
      </div>
      <p className="mt-1 text-xs text-slate-500">{task.project?.name}</p>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-600">{task.assignedTo?.name}</span>
        <span className={isOverdue(task) ? "font-semibold text-red-600" : "text-slate-500"}>{fmtDate(task.deadline)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <StatusSelect task={task} onChange={onStatus} />
        {isAdmin && (
          <span className="flex gap-1">
            <button className={btnSmall} onClick={() => onEdit(task)}>Edit</button>
            <button className={`${btnSmall} text-red-600`} onClick={() => onDelete(task)}>Delete</button>
          </span>
        )}
      </div>
    </div>
  );
}

// Used on the Tasks page (all tasks) and inside a project page (`projectId` given).
export default function TasksView({ projectId, onChanged }) {
  const { user } = useAuth();
  const { notifTick } = useRealtime();
  const toast = useToast();
  const isAdmin = user.role === "admin";

  const [view, setView] = useState("board");
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", project: "", sort: "" });
  const search = useDebounce(filters.search);
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState("");

  const load = useCallback(async () => {
    try {
      const params = {
        search, status: filters.status, priority: filters.priority, sort: filters.sort,
        project: projectId || filters.project,
        page: view === "board" ? 1 : page, limit: view === "board" ? 100 : 10,
      };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const { data } = await api.get("/tasks", { params });
      setTasks(data.data);
      setPagination(data.pagination);
      setError("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [search, filters.status, filters.priority, filters.sort, filters.project, projectId, page, view, notifTick]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, filters.status, filters.priority, filters.sort, filters.project, view]);
  useEffect(() => {
    if (!projectId) api.get("/projects?limit=50").then((r) => setProjects(r.data.data)).catch(() => {});
  }, [projectId]);

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });
  const refresh = () => { load(); onChanged && onChanged(); };

  // Change status: update the screen immediately, then save to the server (undo by reloading on failure).
  const changeStatus = async (task, status) => {
    if (task.status === status) return;
    setTasks((ts) => ts.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await api.patch(`/tasks/${task._id}/status`, { status });
      toast(`"${task.title}" moved to ${STATUS_LABEL[status]}`);
      onChanged && onChanged();
    } catch (err) {
      toast(errMsg(err), "error");
      load();
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/tasks/${deleting._id}`);
      toast("Task deleted");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast(errMsg(err), "error");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (task) => { setEditing(task); setFormOpen(true); };
  const openNew = () => { setEditing(null); setFormOpen(true); };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input className={`${inputCls} !w-48`} placeholder="Search by title" value={filters.search} onChange={setFilter("search")} aria-label="Search tasks" />
        <select className={`${inputCls} !w-auto`} value={filters.status} onChange={setFilter("status")} aria-label="Filter by status">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className={`${inputCls} !w-auto`} value={filters.priority} onChange={setFilter("priority")} aria-label="Filter by priority">
          <option value="">All priorities</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        {!projectId && (
          <select className={`${inputCls} !w-auto`} value={filters.project} onChange={setFilter("project")} aria-label="Filter by project">
            <option value="">All projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        )}
        <select className={`${inputCls} !w-auto`} value={filters.sort} onChange={setFilter("sort")} aria-label="Sort tasks">
          <option value="">Newest first</option><option value="deadline">Deadline: soonest</option><option value="-deadline">Deadline: latest</option>
        </select>
        <div className="ml-auto flex gap-2">
          <div className="flex overflow-hidden rounded-lg border border-slate-300">
            {["board", "list"].map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-2 text-sm font-medium capitalize ${view === v ? "bg-teal-700 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}>{v}</button>
            ))}
          </div>
          {isAdmin && <button className={btnPrimary} onClick={openNew}>New task</button>}
        </div>
      </div>

      <ErrorBox message={error} />
      {loading && tasks.length === 0 ? <Spinner /> : tasks.length === 0 ? (
        <EmptyState text={isAdmin ? "No tasks match these filters. Create one to get the team moving." : "No tasks assigned to you yet."}>
          {isAdmin && <button className={btnPrimary} onClick={openNew}>Create a task</button>}
        </EmptyState>
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map(([status, label, border]) => {
            const items = tasks.filter((t) => t.status === status);
            return (
              <div
                key={status}
                onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
                onDragLeave={() => setDragOver("")}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver("");
                  const task = tasks.find((t) => t._id === e.dataTransfer.getData("text/plain"));
                  if (task) changeStatus(task, status);
                }}
                className={`min-h-40 rounded-xl border-t-4 bg-slate-100 p-3 ${border} ${dragOver === status ? "ring-2 ring-teal-500" : ""}`}
              >
                <p className="mb-3 flex items-center justify-between text-sm font-bold text-slate-700">{label}<span className="rounded-full bg-white px-2 py-0.5 text-xs">{items.length}</span></p>
                <div className="space-y-2">
                  {items.map((t) => <TaskCard key={t._id} task={t} isAdmin={isAdmin} onStatus={changeStatus} onEdit={openEdit} onDelete={setDeleting} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>{["Task", "Project", "Assigned to", "Priority", "Status", "Deadline", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3"><p className="font-medium text-slate-900">{t.title}</p>{t.description && <p className="max-w-xs truncate text-xs text-slate-500">{t.description}</p>}</td>
                    <td className="px-4 py-3">{t.project?.name}</td>
                    <td className="px-4 py-3">{t.assignedTo?.name}</td>
                    <td className="px-4 py-3"><Badge className={PRIORITY_STYLE[t.priority]}>{t.priority}</Badge></td>
                    <td className="px-4 py-3"><StatusSelect task={t} onChange={changeStatus} /></td>
                    <td className={`px-4 py-3 ${isOverdue(t) ? "font-semibold text-red-600" : ""}`}>{fmtDate(t.deadline)}</td>
                    <td className="px-4 py-3 text-right">
                      {isAdmin && <span className="flex justify-end gap-1"><button className={btnSmall} onClick={() => openEdit(t)}>Edit</button><button className={`${btnSmall} text-red-600`} onClick={() => setDeleting(t)}>Delete</button></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      {isAdmin && <TaskForm open={formOpen} onClose={() => setFormOpen(false)} task={editing} projectId={projectId} onSaved={refresh} />}
      <ConfirmDialog open={!!deleting} title="Delete task?" message={`"${deleting?.title}" will be permanently deleted.`} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
