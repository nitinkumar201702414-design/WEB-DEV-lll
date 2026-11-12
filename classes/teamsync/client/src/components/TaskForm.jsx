import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { Modal, Field, ErrorBox, inputCls, btnPrimary, btnGhost, errMsg } from "./ui";

const empty = { title: "", description: "", project: "", assignedTo: "", priority: "medium", status: "pending", deadline: "" };

// Modal form for admins to create/edit a task. `projectId` fixes the project (used inside a project page).
export default function TaskForm({ open, onClose, task, projectId, onSaved }) {
  const toast = useToast();
  const isEdit = !!task;
  const [form, setForm] = useState(empty);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(task
      ? { title: task.title, description: task.description || "", project: task.project?._id || task.project, assignedTo: task.assignedTo?._id || task.assignedTo, priority: task.priority, status: task.status, deadline: task.deadline.slice(0, 10) }
      : { ...empty, project: projectId || "" });
    if (!projectId && !task) api.get("/projects?limit=50").then((r) => setProjects(r.data.data)).catch(() => {});
  }, [open, task, projectId]);

  // Whenever the project changes, load its members for the "Assign to" dropdown.
  useEffect(() => {
    if (!open || !form.project) return setMembers([]);
    api.get(`/projects/${form.project}`).then((r) => setMembers(r.data.data.members)).catch(() => setMembers([]));
  }, [open, form.project]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.project || !form.assignedTo || !form.deadline) return setError("Title, project, assignee and deadline are required");
    setSaving(true);
    try {
      const { project, ...rest } = form;
      if (isEdit) await api.patch(`/tasks/${task._id}`, rest);
      else await api.post("/tasks", form);
      toast(isEdit ? "Task updated" : "Task created and assigned");
      onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit task" : "New task"} wide>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Title"><input className={inputCls} value={form.title} onChange={set("title")} maxLength={150} /></Field>
        <Field label="Description"><textarea className={inputCls} rows={3} value={form.description} onChange={set("description")} maxLength={2000} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {!projectId && !isEdit && (
            <Field label="Project">
              <select className={inputCls} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value, assignedTo: "" })}>
                <option value="">Select a project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </Field>
          )}
          {isEdit && <Field label="Project"><input className={inputCls} value={task.project?.name || ""} disabled /></Field>}
          <Field label="Assign to">
            <select className={inputCls} value={form.assignedTo} onChange={set("assignedTo")} disabled={!form.project}>
              <option value="">{form.project ? "Select a member" : "Choose a project first"}</option>
              {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={form.priority} onChange={set("priority")}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={set("status")}>
              <option value="pending">Pending</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
            </select>
          </Field>
          <Field label="Deadline"><input type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save changes" : "Create task"}</button>
        </div>
      </form>
    </Modal>
  );
}
