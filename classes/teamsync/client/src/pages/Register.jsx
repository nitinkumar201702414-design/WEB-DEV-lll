import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import { ErrorBox, Field, btnPrimary, errMsg, inputCls } from "../components/ui";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError("All fields are required");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    setBusy(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join your team on TeamSync.">
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Full name"><input className={inputCls} value={form.name} onChange={set("name")} autoComplete="name" /></Field>
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={set("email")} autoComplete="email" /></Field>
        <Field label="Password"><input type="password" className={inputCls} value={form.password} onChange={set("password")} autoComplete="new-password" /></Field>
        <Field label="Confirm password"><input type="password" className={inputCls} value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-semibold text-teal-700 hover:underline">Log in</Link></p>
    </AuthShell>
  );
}
