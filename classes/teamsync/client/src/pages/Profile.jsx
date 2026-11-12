import { useState } from "react";
import api, { setAccessToken } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Badge, ErrorBox, Field, btnPrimary, errMsg, fmtDate, inputCls } from "../components/ui";

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [info, setInfo] = useState({ name: user.name, profilePicture: user.profilePicture || "" });
  const [infoError, setInfoError] = useState("");
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [busy, setBusy] = useState("");

  const saveInfo = async (e) => {
    e.preventDefault();
    setInfoError("");
    if (info.name.trim().length < 2) return setInfoError("Name must be at least 2 characters");
    setBusy("info");
    try {
      const { data } = await api.patch("/users/me", info);
      setUser(data.data);
      toast("Profile updated");
    } catch (err) { setInfoError(errMsg(err)); } finally { setBusy(""); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pw.newPassword.length < 8) return setPwError("New password must be at least 8 characters");
    if (pw.newPassword !== pw.confirmPassword) return setPwError("Passwords do not match");
    setBusy("pw");
    try {
      const { data } = await api.patch("/users/me/password", pw);
      setAccessToken(data.data.accessToken);
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast("Password changed. Other devices were logged out.");
    } catch (err) { setPwError(errMsg(err)); } finally { setBusy(""); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-4">
          {user.profilePicture
            ? <img src={user.profilePicture} alt="" className="h-16 w-16 rounded-full object-cover" />
            : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-700 font-display text-2xl font-bold text-white">{user.name[0].toUpperCase()}</div>}
          <div>
            <p className="font-semibold">{user.email}</p>
            <p className="mt-1 text-xs text-slate-500"><Badge className="mr-2 bg-slate-100 capitalize text-slate-700">{user.role}</Badge>Member since {fmtDate(user.createdAt)}</p>
          </div>
        </div>
        <form onSubmit={saveInfo} className="space-y-4">
          <ErrorBox message={infoError} />
          <Field label="Full name"><input className={inputCls} value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} /></Field>
          <Field label="Profile picture URL (optional)"><input className={inputCls} value={info.profilePicture} onChange={(e) => setInfo({ ...info, profilePicture: e.target.value })} placeholder="https://..." /></Field>
          <Field label="Email"><input className={inputCls} value={user.email} disabled /></Field>
          <button className={btnPrimary} disabled={busy === "info"}>{busy === "info" ? "Saving..." : "Save changes"}</button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold">Change password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <ErrorBox message={pwError} />
          <Field label="Current password"><input type="password" className={inputCls} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
          <Field label="New password"><input type="password" className={inputCls} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" /></Field>
          <Field label="Confirm new password"><input type="password" className={inputCls} value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} autoComplete="new-password" /></Field>
          <button className={btnPrimary} disabled={busy === "pw"}>{busy === "pw" ? "Updating..." : "Update password"}</button>
        </form>
      </section>
    </div>
  );
}
