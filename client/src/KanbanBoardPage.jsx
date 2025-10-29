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
    const [allPlans, setAllPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedTask, setSelectedTask] = useState(null);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
    const [createAppSelection, setCreateAppSelection] = useState("");
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [taskApplication, setTaskApplication] = useState(null);

    const STATES = ["Open", "To-Do", "Doing", "Done", "Closed"];

    const isProjectManager = user?.groups?.includes("project manager");

    // Filter applications where user can create tasks
    const getCreateableApplications = () => {
        if (!user?.groups) return [];

        return applications.filter(app => {
            const permitGroups = Array.isArray(app.App_permit_Create)
                ? app.App_permit_Create
                : [];
            return permitGroups.some(group => user.groups.includes(group));
        });
    };

    const createableApplications = getCreateableApplications();

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

                // Fetch plans for all applications
                const planPromises = apps.map(app =>
                    axios
                        .get(`/plans/${app.App_Acronym}`)
                        .catch(() => ({ data: { data: [] } }))
                );

                const planResults = await Promise.all(planPromises);
                const allPlansData = planResults.flatMap(res =>
                    res.data.success ? res.data.data : []
                );

                setAllPlans(allPlansData);
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

    const getPlanDetails = planName => {
        if (!planName) return null;
        return allPlans.find(plan => plan.Plan_MVP_name === planName) || null;
    };

    const handleTaskClick = async task => {
        setSelectedTask(task);

        // Get the application for this task
        const app = applications.find(a => a.App_Acronym === task.Task_app_Acronym);
        setTaskApplication(app || null);

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

    const handleTaskUpdate = async () => {
        // Refresh all data first
        await fetchAllData();
        // Then refresh the selected task specifically
        if (selectedTask) {
            try {
                const { data } = await axios.get(`/task/${selectedTask.Task_id}`);
                if (data.success && data.data) {
                    setSelectedTask(data.data);
                    // Update the application for this task
                    const app = applications.find(a => a.App_Acronym === data.data.Task_app_Acronym);
                    setTaskApplication(app || null);
                }
            } catch (err) {
                console.error("Failed to refresh selected task:", err);
            }
        }
    };

    const handleCreateTask = () => {
        if (createableApplications.length === 0) {
            setError("You don't have permission to create tasks for any application");
            return;
        }
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
        // Don't pre-select an application - let user choose
        setCreateAppSelection("");
        setSelectedApplication(null);
        setShowCreatePlanModal(true);
    };

    const handlePlanApplicationChange = async (newAppAcronym) => {
        setCreateAppSelection(newAppAcronym);
        // Fetch the selected application
        const app = applications.find(a => a.App_Acronym === newAppAcronym);
        setSelectedApplication(app || null);
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
                            Kanban
                        </h1>

                        {isProjectManager && (
                            <button
                                onClick={handleCreatePlan}
                                disabled={applications.length === 0}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                + Add Plan
                            </button>
                        )}
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
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="font-semibold text-gray-900">
                                        {state}
                                    </h2>
                                    {state === "Open" && createableApplications.length > 0 && (
                                        <button
                                            onClick={handleCreateTask}
                                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                        >
                                            + Add Task
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white border-x border-b rounded-b-lg p-2 min-h-[500px] space-y-2">
                                {getTasksByState(state).map(task => (
                                    <TaskCard
                                        key={task.Task_id}
                                        task={task}
                                        onClick={() => handleTaskClick(task)}
                                        showAppName={true}
                                        planDetails={getPlanDetails(task.Task_plan)}
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
                applications={createableApplications}
                plans={plans}
                onApplicationChange={handleApplicationChange}
            />

            <TaskModal
                isOpen={!!selectedTask}
                onClose={() => {
                    setSelectedTask(null);
                    setTaskApplication(null);
                    setPlans([]);
                }}
                onSuccess={fetchAllData}
                task={selectedTask}
                application={taskApplication}
                plans={plans}
            />

            <PlanModal
                isOpen={showCreatePlanModal}
                onClose={() => {
                    setShowCreatePlanModal(false);
                    setCreateAppSelection("");
                    setSelectedApplication(null);
                }}
                onSuccess={() => {
                    fetchAllData();
                    setShowCreatePlanModal(false);
                    setCreateAppSelection("");
                    setSelectedApplication(null);
                }}
                appAcronym={createAppSelection}
                application={selectedApplication}
                applications={applications}
                onApplicationChange={handlePlanApplicationChange}
            />
        </div>
    );
};

export default KanbanBoardPage;
