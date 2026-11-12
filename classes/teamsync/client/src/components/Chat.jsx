import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";
import { ErrorBox, Spinner, btnPrimary, errMsg, fmtDateTime, inputCls } from "./ui";

// Real-time project chat: history from the REST API, live messages through Socket.IO.
export default function Chat({ projectId, members }) {
  const { user } = useAuth();
  const { socket, onlineIds } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState({});
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // 1) Load previous messages
  useEffect(() => {
    api.get(`/messages/${projectId}`, { params: { limit: 100 } })
      .then((r) => setMessages(r.data.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [projectId]);

  // 2) Join the project's room and listen for live events
  useEffect(() => {
    if (!socket) return;
    const join = () => socket.emit("project:join", projectId, (res) => { if (!res?.ok) setError(res?.message || "Could not join chat"); });
    const onMessage = (m) => {
      if (m.project !== projectId) return;
      setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
    };
    const onTyping = ({ projectId: pid, userId, name, isTyping }) => {
      if (pid !== projectId) return;
      setTyping((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = name; else delete next[userId];
        return next;
      });
    };
    socket.on("connect", join); // re-join after a reconnect
    socket.on("message:new", onMessage);
    socket.on("typing", onTyping);
    join();
    return () => {
      socket.emit("project:leave", projectId);
      socket.off("connect", join);
      socket.off("message:new", onMessage);
      socket.off("typing", onTyping);
    };
  }, [socket, projectId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const onChange = (e) => {
    setText(e.target.value);
    socket?.emit("typing", { projectId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket?.emit("typing", { projectId, isTyping: false }), 1500);
  };

  const send = (e) => {
    e.preventDefault();
    const message = text.trim();
    if (!message || !socket) return;
    socket.emit("message:send", { projectId, message }, (res) => { if (!res?.ok) setError(res?.message || "Message not sent"); });
    setText("");
    clearTimeout(typingTimer.current);
    socket.emit("typing", { projectId, isTyping: false });
  };

  const typingNames = Object.values(typing);

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
      <div className="flex h-[28rem] flex-col rounded-xl border border-slate-200 bg-white">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? <Spinner /> : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No messages yet. Say hello to the team.</p>
          ) : messages.map((m) => {
            const mine = m.sender?._id === user._id;
            return (
              <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${mine ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-900"}`}>
                  <p className={`text-xs font-semibold ${mine ? "text-teal-100" : "text-slate-500"}`}>{mine ? "You" : m.sender?.name || "Unknown"} <span className="font-normal opacity-80">{fmtDateTime(m.createdAt)}</span></p>
                  <p className="whitespace-pre-wrap break-words text-sm">{m.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="h-5 px-4 text-xs italic text-slate-500">
          {typingNames.length > 0 && `${typingNames.join(", ")} ${typingNames.length > 1 ? "are" : "is"} typing...`}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-slate-200 p-3">
          <input className={inputCls} value={text} onChange={onChange} placeholder="Write a message" maxLength={2000} aria-label="Message" />
          <button className={btnPrimary} disabled={!text.trim()}>Send</button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-bold text-slate-700">Members</p>
        <ul className="space-y-2">
          {members.map((m) => {
            const online = onlineIds.includes(m._id);
            return (
              <li key={m._id} className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 rounded-full ${online ? "bg-green-500" : "bg-slate-300"}`} />
                <span className="truncate">{m.name}</span>
                <span className="ml-auto text-xs text-slate-400">{online ? "online" : "offline"}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3"><ErrorBox message={error} /></div>
      </div>
    </div>
  );
}
