import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { useToast } from "../context/ToastContext";
import Chat from "../components/Chat";
import TasksView from "../components/TasksView";
import { Badge, EmptyState, ErrorBox, PROJECT_STATUS_STYLE, ProgressBar, Spinner, btnPrimary, btnSmall, errMsg, fmtDate, inputCls } from "../components/ui";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { onlineIds } = useRealtime();
  const toast = useToast();
  const isAdmin = user.role === "admin";
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("tasks");
  const [allUsers, setAllUsers] = useState([]);
  const [newMember, setNewMember] = useState("");

  const load = useCallback(() => {
    api.get(`/projects/${id}`).then((r) => setProject(r.data.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (isAdmin) api.get("/users?limit=100").then((r) => setAllUsers(r.data.data)).catch(() => {}); }, [isAdmin]);

  if (error) return <div className="space-y-3"><ErrorBox message={error} /><Link to="/projects" className="text-sm font-medium text-teal-700">Back to projects</Link></div>;
  if (!project) return <Spinner />;

  const isMember = project.members.some((m) => m._id === user._id);
  const candidates = allUsers.filter((u) => !project.members.some((m) => m._id === u._id));

  const addMember = async () => {
    if (!newMember) return;
    try {
      const { data } = await api.post(`/projects/${id}/members`, { userId: newMember });
      setProject(data.data); setNewMember(""); toast("Member added");
    } catch (err) { toast(errMsg(err), "error"); }
  };
  const removeMember = async (m) => {
    if (!window.confirm(`Remove ${m.name} from this project?`)) return;
    try {
      const { data } = await api.delete(`/projects/${id}/members/${m._id}`);
      setProject(data.data); toast("Member removed");
    } catch (err) { toast(errMsg(err), "error"); }
  };

  const tabs = [["tasks", "Tasks"], ["members", "Members"], ["chat", "Chat"]];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-sm font-medium text-teal-700 hover:underline">All projects</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge className={PROJECT_STATUS_STYLE[project.status]}>{project.status}</Badge>
        </div>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{project.description || "No description"}</p>
        <p className="mt-1 text-xs text-slate-500">{fmtDate(project.startDate)} to {fmtDate(project.endDate)} &middot; created by {project.createdBy?.name}</p>
        <div className="mt-4 max-w-md">
          <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Progress</span><span>{project.progress}%</span></div>
          <ProgressBar value={project.progress} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === key ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{label}</button>
        ))}
      </div>

      {tab === "tasks" && <TasksView projectId={id} onChanged={load} />}

      {tab === "members" && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <select className={`${inputCls} !w-64`} value={newMember} onChange={(e) => setNewMember(e.target.value)} aria-label="User to add">
                <option value="">Select a user to add</option>
                {candidates.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
              <button className={btnPrimary} onClick={addMember} disabled={!newMember}>Add member</button>
            </div>
          )}
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {project.members.map((m) => (
              <li key={m._id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${onlineIds.includes(m._id) ? "bg-green-500" : "bg-slate-300"}`} />
                  <div><p className="text-sm font-medium">{m.name}</p><p className="text-xs text-slate-500">{m.email}</p></div>
                </div>
                {isAdmin && m._id !== project.createdBy?._id && <button className={`${btnSmall} text-red-600`} onClick={() => removeMember(m)}>Remove</button>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "chat" && (isMember
        ? <Chat projectId={id} members={project.members} />
        : <EmptyState text="Only project members can use the project chat. Add yourself as a member to join." />)}
    </div>
  );
}
