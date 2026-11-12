import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDebounce from "../utils/useDebounce";
import ProjectForm from "../components/ProjectForm";
import { Badge, ConfirmDialog, EmptyState, Pagination, PROJECT_STATUS_STYLE, ProgressBar, Spinner, btnPrimary, btnSmall, errMsg, fmtDate, inputCls } from "../components/ui";

export default function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === "admin";
  const [projects, setProjects] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get("/projects", { params: { page, limit: 9, search: q || undefined } })
      .then((r) => { setProjects(r.data.data); setPagination(r.data.pagination); })
      .catch((e) => toast(errMsg(e), "error"));
  }, [page, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/projects/${deleting._id}`);
      toast("Project deleted");
      setDeleting(null);
      load();
    } catch (err) { toast(errMsg(err), "error"); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <input className={`${inputCls} !w-52`} placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search projects" />
          {isAdmin && <button className={btnPrimary} onClick={() => { setEditing(null); setFormOpen(true); }}>New project</button>}
        </div>
      </div>

      {!projects ? <Spinner /> : projects.length === 0 ? (
        <EmptyState text={isAdmin ? "No projects yet. Create the first one to get your team started." : "You haven't been added to any project yet."} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <div key={p._id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/projects/${p._id}`} className="font-display text-lg font-bold hover:text-teal-700">{p.name}</Link>
                  <Badge className={PROJECT_STATUS_STYLE[p.status]}>{p.status}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">{p.description || "No description"}</p>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500"><span>{p.taskCounts.completed} of {p.taskCounts.pending + p.taskCounts["in-progress"] + p.taskCounts.completed} tasks done</span><span>{p.progress}%</span></div>
                  <ProgressBar value={p.progress} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{p.members.length} member{p.members.length === 1 ? "" : "s"}</span><span>{fmtDate(p.startDate)} to {fmtDate(p.endDate)}</span>
                </div>
                {isAdmin && (
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                    <button className={btnSmall} onClick={() => { setEditing(p); setFormOpen(true); }}>Edit</button>
                    <button className={`${btnSmall} text-red-600`} onClick={() => setDeleting(p)}>Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      {isAdmin && <ProjectForm open={formOpen} onClose={() => setFormOpen(false)} project={editing} onSaved={load} />}
      <ConfirmDialog open={!!deleting} title="Delete project?" message={`"${deleting?.name}" will be deleted together with all of its tasks and chat messages. This cannot be undone.`} busy={busy} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </div>
  );
}
