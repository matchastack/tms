import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Header from "./Header";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";
import PlanModal from "./PlanModal";
import axios from "axios";

const KanbanBoardPage = () => {
    const { logout, user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
    const [createAppSelection, setCreateAppSelection] = useState("");

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
        return tasks.filter(task => task && task.Task_state === state);
    };

    const handleTaskClick = async task => {
        setSelectedTask(task);

        // Fetch plans for the task's application
        try {
            const { data } = await axios.get(`/plans/${task.Task_app_Acronym}`);
            if (data.success) {
                setPlans(data.data || []);
            }
        } catch (err) {
            setPlans([]);
        }
    };

    const handleCreateTask = () => {
        setCreateAppSelection("");
        setPlans([]);
        setShowCreateTaskModal(true);
    };

    const fetchPlansForApp = async appAcronym => {
        if (!appAcronym) {
            setPlans([]);
            return;
        }
        try {
            const { data } = await axios.get(`/plans/${appAcronym}`);
            if (data.success) {
                setPlans(data.data || []);
            }
        } catch (err) {
            setPlans([]);
        }
    };

    const handleApplicationChange = async newAppAcronym => {
        setCreateAppSelection(newAppAcronym);
        await fetchPlansForApp(newAppAcronym);
    };

    const handleCreatePlan = () => {
        if (applications.length > 0) {
            setCreateAppSelection(applications[0].App_Acronym);
        }
        setShowCreatePlanModal(true);
    };

    const getSelectedApplication = () => {
        return applications.find(app => app.App_Acronym === createAppSelection);
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
                            <button
                                onClick={handleCreatePlan}
                                disabled={applications.length === 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                + Create Plan
                            </button>
                            <button
                                onClick={handleCreateTask}
                                disabled={applications.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                + Create Task
                            </button>
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
                                        showAppName={true}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <TaskModal
                isOpen={showCreateTaskModal && !selectedTask}
                onClose={() => {
                    setShowCreateTaskModal(false);
                    setCreateAppSelection("");
                    setPlans([]);
                }}
                onSuccess={() => {
                    fetchAllData();
                    setShowCreateTaskModal(false);
                    setCreateAppSelection("");
                    setPlans([]);
                }}
                application={getSelectedApplication()}
                appAcronym={createAppSelection}
                applications={applications}
                plans={plans}
                onApplicationChange={handleApplicationChange}
            />

            <TaskModal
                isOpen={!!selectedTask}
                onClose={() => {
                    setSelectedTask(null);
                    setPlans([]);
                }}
                onSuccess={fetchAllData}
                task={selectedTask}
                plans={plans}
            />

            <PlanModal
                isOpen={showCreatePlanModal}
                onClose={() => {
                    setShowCreatePlanModal(false);
                    setCreateAppSelection("");
                }}
                onSuccess={() => {
                    fetchAllData();
                    setShowCreatePlanModal(false);
                    setCreateAppSelection("");
                }}
                appAcronym={createAppSelection}
            />
        </div>
    );
};

export default KanbanBoardPage;
