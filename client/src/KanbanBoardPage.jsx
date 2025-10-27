import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Header from "./Header";
import TaskCard from "./TaskCard";
// import TaskModal from "./TaskModal";
import axios from "axios";

const KanbanBoardPage = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedApp, setSelectedApp] = useState("all");

    const STATES = ["Open", "To-Do", "Doing", "Done", "Closed"];

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const appsRes = await axios.get("/applications");

            if (appsRes.data.success) {
                const apps = appsRes.data.data;
                setApplications(apps);

                // Fetch tasks for all applications
                const taskPromises = apps.map(app =>
                    axios
                        .get(`/tasks/${app.App_Acronym}`)
                        .catch(() => ({ data: { data: [] } }))
                );

                const taskResults = await Promise.all(taskPromises);
                const allTasks = taskResults.flatMap(res =>
                    res.data.success ? res.data.data : []
                );

                setTasks(allTasks);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const getTasksByState = state => {
        let filtered = tasks.filter(task => task.Task_state === state);

        // Filter by selected application if not "all"
        if (selectedApp !== "all") {
            filtered = filtered.filter(
                task => task.Task_app_Acronym === selectedApp
            );
        }

        return filtered;
    };

    const handleTaskClick = task => {
        setSelectedTask(task);
    };

    const getColumnColor = state => {
        const colors = {
            Open: "bg-gray-100 border-gray-300",
            "To-Do": "bg-blue-50 border-blue-300",
            Doing: "bg-yellow-50 border-yellow-300",
            Done: "bg-green-50 border-green-300",
            Closed: "bg-purple-50 border-purple-300"
        };
        return colors[state] || "bg-gray-100";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header onLogout={logout} showLogout={true} />
                <div className="text-center py-12 text-gray-500">
                    Loading tasks...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onLogout={logout} showLogout={true} />

            <main className="p-8">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">
                            All Tasks
                        </h1>

                        <div className="flex items-center gap-4">
                            <select
                                value={selectedApp}
                                onChange={e => setSelectedApp(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Applications</option>
                                {applications.map(app => (
                                    <option
                                        key={app.App_Acronym}
                                        value={app.App_Acronym}
                                    >
                                        {app.App_Acronym}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
                    {STATES.map(state => (
                        <div key={state} className="min-w-[250px]">
                            <div
                                className={`rounded-t-lg border-t-4 ${getColumnColor(
                                    state
                                )} p-3`}
                            >
                                <h2 className="font-semibold text-gray-900 text-center">
                                    {state}
                                </h2>
                                <p className="text-sm text-gray-600 text-center">
                                    {getTasksByState(state).length} tasks
                                </p>
                            </div>
                            <div className="bg-white border-x border-b rounded-b-lg p-2 min-h-[500px] space-y-2">
                                {getTasksByState(state).map(task => (
                                    <TaskCard
                                        key={task.Task_id}
                                        task={task}
                                        onClick={() => handleTaskClick(task)}
                                        showAppName={selectedApp === "all"}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* <TaskModal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onSuccess={fetchAllData}
                task={selectedTask}
            /> */}
        </div>
    );
};

export default KanbanBoardPage;
