import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

// Logged-in users can't see the login/register pages.
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner className="py-40" />;
  return user ? <Navigate to="/" replace /> : children;
}

// "/" sends each role to its own dashboard.
function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <RealtimeProvider>
            <Routes>
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<HomeRedirect />} />
                <Route path="admin" element={<ProtectedRoute roles={["admin"]}><Dashboard /></ProtectedRoute>} />
                <Route path="dashboard" element={<ProtectedRoute roles={["user"]}><Dashboard /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RealtimeProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
