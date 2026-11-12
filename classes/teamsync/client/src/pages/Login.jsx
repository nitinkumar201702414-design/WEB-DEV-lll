import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import { ErrorBox, Field, btnPrimary, errMsg, inputCls } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email.trim() || !form.password) return setError("Enter your email and password");
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || "/", { replace: true }); // "/" redirects by role
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your TeamSync workspace.">
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></Field>
        <Field label="Password"><input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">New here? <Link to="/register" className="font-semibold text-teal-700 hover:underline">Create an account</Link></p>
    </AuthShell>
  );
}
