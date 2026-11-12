export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-[#10222b] p-12 text-white lg:flex">
        <p className="font-display text-2xl font-bold">TeamSync</p>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">Plan the work.<br />Talk it through.<br />Ship it together.</h2>
          <p className="mt-4 max-w-sm text-slate-300">Projects, tasks and project chat in one place, updated live for everyone on the team.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {["Pending", "In Progress", "Completed"].map((s, i) => (
            <span key={s} className={`rounded-full px-3 py-1 font-semibold ${["bg-slate-600", "bg-amber-400 text-slate-900", "bg-teal-400 text-slate-900"][i]}`}>{s}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
