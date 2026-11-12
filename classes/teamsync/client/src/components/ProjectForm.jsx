import { useEffect, useState } from "react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";
import { Modal, Field, ErrorBox, inputCls, btnPrimary, btnGhost, errMsg } from "./ui";

const empty = { name: "", description: "", startDate: "", endDate: "", status: "planning", members: [] };

// Modal form used by admins to create or edit a project. (Members of an existing project are managed on its detail page.)
export default function ProjectForm({ open, onClose, project, onSaved }) {
  const toast = useToast();
  const isEdit = !!project;
  const [form, setForm] = useState(empty);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(project
      ? { name: project.name, description: project.description || "", startDate: project.startDate.slice(0, 10), endDate: project.endDate.slice(0, 10), status: project.status, members: [] }
      : empty);
    if (!project) api.get("/users?limit=100").then((r) => setUsers(r.data.data)).catch(() => {});
  }, [open, project]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggleMember = (id) =>
    setForm({ ...form, members: form.members.includes(id) ? form.members.filter((m) => m !== id) : [...form.members, id] });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.startDate || !form.endDate) return setError("Name, start date and end date are required");
    if (form.endDate < form.startDate) return setError("End date must be on or after the start date");
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, startDate: form.startDate, endDate: form.endDate, status: form.status };
      if (isEdit) await api.patch(`/projects/${project._id}`, payload);
      else await api.post("/projects", { ...payload, members: form.members });
      toast(isEdit ? "Project updated" : "Project created");
      onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit project" : "New project"} wide>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Project name"><input className={inputCls} value={form.name} onChange={set("name")} maxLength={100} /></Field>
        <Field label="Description"><textarea className={inputCls} rows={3} value={form.description} onChange={set("description")} maxLength={1000} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Start date"><input type="date" className={inputCls} value={form.startDate} onChange={set("startDate")} /></Field>
          <Field label="End date"><input type="date" className={inputCls} value={form.endDate} onChange={set("endDate")} /></Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={set("status")}>
              <option value="planning">Planning</option><option value="active">Active</option>
              <option value="on-hold">On hold</option><option value="completed">Completed</option>
            </select>
          </Field>
        </div>
        {!isEdit && (
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Members <span className="font-normal text-slate-400">(you are added automatically)</span></p>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {users.map((u) => (
                <label key={u._id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={form.members.includes(u._id)} onChange={() => toggleMember(u._id)} />
                  {u.name} <span className="text-slate-400">{u.email}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} disabled={saving}>{saving ? "Saving..." : isEdit ? "Save changes" : "Create project"}</button>
        </div>
      </form>
    </Modal>
  );
}
