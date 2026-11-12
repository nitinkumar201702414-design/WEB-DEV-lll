import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import api, { getAccessToken, refreshAccessToken } from "../api/axios";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const RealtimeContext = createContext(null);

// Opens ONE Socket.IO connection while the user is logged in and shares:
// the socket, unread notification count, latest notifications and who is online.
export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [notifTick, setNotifTick] = useState(0); // bumps when a live notification arrives

  const reloadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications?limit=8");
      setLatest(data.data);
      setUnreadCount(data.unreadCount);
    } catch (err) { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) {
      setSocket(null); setUnreadCount(0); setLatest([]); setOnlineIds([]);
      return;
    }
    const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    // auth is a function so reconnects always send the newest access token.
    const s = io(url, { auth: (cb) => cb({ token: getAccessToken() }), withCredentials: true });
    let retries = 0;

    s.on("connect", () => {
      retries = 0;
      s.emit("presence:get", (ids) => setOnlineIds(ids || []));
    });
    s.on("connect_error", async () => {
      // Most likely our access token expired: refresh it and try again (max 3 times).
      if (retries++ < 3) {
        try { await refreshAccessToken(); s.connect(); } catch (err) { /* logged out */ }
      }
    });
    s.on("presence:update", ({ userId, online }) =>
      setOnlineIds((prev) => (online ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId)))
    );
    s.on("notification:new", (n) => {
      setUnreadCount((c) => c + 1);
      setLatest((l) => [n, ...l].slice(0, 8));
      setNotifTick((t) => t + 1);
      toast(n.message, "info");
    });

    setSocket(s);
    reloadNotifications();
    return () => { s.disconnect(); };
  }, [user?._id]);

  return (
    <RealtimeContext.Provider value={{ socket, unreadCount, latest, onlineIds, notifTick, reloadNotifications }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => useContext(RealtimeContext);
