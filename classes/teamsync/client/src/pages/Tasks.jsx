import TasksView from "../components/TasksView";
import { useAuth } from "../context/AuthContext";

export default function Tasks() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{user.role === "admin" ? "All tasks" : "My tasks"}</h1>
      <TasksView />
    </div>
  );
}
