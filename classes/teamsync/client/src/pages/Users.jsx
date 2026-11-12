import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useDebounce from "../utils/useDebounce";
import { Badge, ErrorBox, Field, Modal, Pagination, Spinner, btnGhost, btnPrimary, errMsg, fmtDate, inputCls } from "../components/ui";

const emptyForm = { name: "", email: "", password: "", role: "user" };

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const q = useDebounce(search);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get("/users", { params: { page, limit: 10, search: q || undefined } })
      .then((r) => { setUsers(r.data.data); setPagination(r.data.pagination); })
      .catch((e) => toast(errMsg(e), "error"));
  }, [page, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q]);

  const changeRole = async (u, role) => {
    try {
      await api.patch(`/users/${u._id}/role`, { role });
      toast(`${u.name} is now ${role === "admin" ? "an admin" : "a regular user"}`);
      load();
    } catch (err) { toast(errMsg(err), "error"); }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.email.trim() || form.password.length < 8) return setFormError("Name, email and a password of at least 8 characters are required");
    setSaving(true);
    try {
      await api.post("/users", form);
      toast("User created");
      setOpen(false); setForm(emptyForm); load();
    } catch (err) { setFormError(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">User management</h1>
        <div className="flex gap-2">
          <input className={`${inputCls} !w-56`} placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
          <button className={btnPrimary} onClick={() => { setForm(emptyForm); setFormError(""); setOpen(true); }}>Add user</button>
        </div>
      </div>

      {!users ? <Spinner /> : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>{["Name", "Email", "Role", "Joined"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium">{u.name}{u._id === me._id && <Badge className="ml-2 bg-slate-100 text-slate-600">you</Badge>}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm disabled:bg-slate-100" value={u.role} disabled={u._id === me._id} onChange={(e) => changeRole(u, e.target.value)} aria-label={`Role for ${u.name}`}>
                        <option value="user">User</option><option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPage={setPage} />
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add user">
        <form onSubmit={createUser} className="space-y-4">
          <ErrorBox message={formError} />
          <Field label="Full name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Temporary password"><input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role">
            <select className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="user">User</option><option value="admin">Admin</option></select>
          </Field>
          <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={() => setOpen(false)}>Cancel</button><button className={btnPrimary} disabled={saving}>{saving ? "Creating..." : "Create user"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
