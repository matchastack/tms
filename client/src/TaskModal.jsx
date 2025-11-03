import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

const TaskModal = ({
    isOpen,
    onClose,
    onSuccess,
    onTaskUpdate = null,
    task = null,
    application,
    appAcronym,
    applications = [],
    plans = [],
    onApplicationChange
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        Task_name: "",
        Task_description: "",
        Task_plan: "",
        notes: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isCreate = !task;

    useEffect(() => {
        if (isOpen) {
            if (task) {
                setFormData({
                    Task_name: task.Task_name || "",
                    Task_description: task.Task_description || "",
                    Task_plan: task.Task_plan || "",
                    notes: ""
                });
            } else {
                setFormData({
                    Task_name: "",
                    Task_description: "",
                    Task_plan: "",
                    notes: ""
                });
            }
            setError("");
        }
    }, [isOpen, task]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const canPromote = () => {
        if (!task || !application || !user?.groups) return false;
        const state = task.Task_state;

        let permitGroups = [];
        if (state === "Open") {
            permitGroups = Array.isArray(application.App_permit_Open)
                ? application.App_permit_Open
                : [];
        } else if (state === "To-Do") {
            permitGroups = Array.isArray(application.App_permit_toDoList)
                ? application.App_permit_toDoList
                : [];
        } else if (state === "Doing") {
            permitGroups = Array.isArray(application.App_permit_Doing)
                ? application.App_permit_Doing
                : [];
        } else if (state === "Done") {
            permitGroups = Array.isArray(application.App_permit_Done)
                ? application.App_permit_Done
                : [];
        }

        return permitGroups.some(group => user.groups.includes(group));
    };

    const canDemote = () => {
        if (!task || !application || !user?.groups) return false;
        const state = task.Task_state;

        let permitGroups = [];
        if (state === "Doing") {
            permitGroups = Array.isArray(application.App_permit_Doing)
                ? application.App_permit_Doing
                : [];
        } else if (state === "Done") {
            permitGroups = Array.isArray(application.App_permit_Done)
                ? application.App_permit_Done
                : [];
        }

        return permitGroups.some(group => user.groups.includes(group));
    };

    const canEditPlan = () => {
        if (!task || !application || !user?.groups) return false;
        const permitGroups = Array.isArray(application.App_permit_Open)
            ? application.App_permit_Open
            : [];
        return permitGroups.some(group => user.groups.includes(group));
    };

    const canAddNotes = () => {
        if (!task || !application || !user?.groups) return false;
        if (task.Task_state === "Closed") return false;

        const state = task.Task_state;
        let permitGroups = [];

        if (state === "Open") {
            permitGroups = Array.isArray(application.App_permit_Open)
                ? application.App_permit_Open
                : [];
        } else if (state === "To-Do") {
            permitGroups = Array.isArray(application.App_permit_toDoList)
                ? application.App_permit_toDoList
                : [];
        } else if (state === "Doing") {
            permitGroups = Array.isArray(application.App_permit_Doing)
                ? application.App_permit_Doing
                : [];
        } else if (state === "Done") {
            permitGroups = Array.isArray(application.App_permit_Done)
                ? application.App_permit_Done
                : [];
        }

        return permitGroups.some(group => user.groups.includes(group));
    };

    const handleCreateTask = async e => {
        e.preventDefault();
        setError("");

        if (!appAcronym) {
            setError("Please select an application");
            return;
        }

        setLoading(true);

        try {
            const { data } = await axios.post("/tasks", {
                Task_name: formData.Task_name,
                Task_description: formData.Task_description,
                Task_plan: formData.Task_plan || null,
                notes: "Task created.",
                Task_app_Acronym: appAcronym
            });

            if (data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePlan = async (planValue = null) => {
        if (!task) return;
        setError("");
        setLoading(true);

        const planToUpdate =
            planValue !== null ? planValue : formData.Task_plan;

        try {
            const { data } = await axios.put("/tasks", {
                task_id: task.Task_id,
                plan_name: planToUpdate || null
            });

            if (data.success) {
                if (onTaskUpdate) {
                    onTaskUpdate();
                } else {
                    onSuccess();
                }
                setError("");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update plan");
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!task || !formData.notes.trim()) return;
        setError("");
        setLoading(true);

        try {
            const { data } = await axios.put("/tasks", {
                task_id: task.Task_id,
                notes: formData.notes
            });

            if (data.success) {
                if (onTaskUpdate) {
                    onTaskUpdate();
                } else {
                    onSuccess();
                }
                setFormData(prev => ({ ...prev, notes: "" }));
                setError("");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to add note");
        } finally {
            setLoading(false);
        }
    };

    const handlePromote = async () => {
        if (!task) return;
        setError("");
        setLoading(true);

        try {
            const { data } = await axios.post("/tasks/promote", {
                task_id: task.Task_id,
                notes:
                    task.Task_state === "Open"
                        ? "Task released: Open → To-Do."
                        : task.Task_state === "To-Do"
                        ? "Task taken: To-Do → Doing."
                        : task.Task_state === "Doing"
                        ? "Task reviewed: Doing → Done."
                        : task.Task_state === "Done"
                        ? "Task approved: Done → Closed."
                        : formData.notes || undefined,
                expected_state: task.Task_state
            });

            if (data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to promote task");
        } finally {
            setLoading(false);
        }
    };

    const handleDemote = async () => {
        if (!task) return;
        setError("");
        setLoading(true);

        try {
            const { data } = await axios.post("/tasks/demote", {
                task_id: task.Task_id,
                notes:
                    task.Task_state === "Doing"
                        ? "Task dropped: Doing → To-Do."
                        : task.Task_state === "Done"
                        ? "Task rejected: Done → Doing."
                        : formData.notes || undefined,
                expected_state: task.Task_state
            });

            if (data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to demote task");
        } finally {
            setLoading(false);
        }
    };

    const getStateColor = state => {
        const colors = {
            Open: "bg-gray-200 text-gray-800",
            "To-Do": "bg-blue-200 text-blue-800",
            Doing: "bg-yellow-200 text-yellow-800",
            Done: "bg-green-200 text-green-800",
            Closed: "bg-purple-200 text-purple-800"
        };
        return colors[state] || "bg-gray-200 text-gray-800";
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isCreate
                            ? "Create Task"
                            : `${task.Task_id}: ${task.Task_name}`}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {isCreate ? (
                        <form onSubmit={handleCreateTask}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Application
                                </label>
                                <select
                                    value={appAcronym || ""}
                                    onChange={e =>
                                        onApplicationChange &&
                                        onApplicationChange(e.target.value)
                                    }
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">
                                        Select an application...
                                    </option>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 mt-5">
                                    Task Name
                                </label>
                                <input
                                    type="text"
                                    name="Task_name"
                                    value={formData.Task_name}
                                    onChange={handleChange}
                                    required
                                    maxLength={255}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 mt-5">
                                    Task Description
                                </label>
                                <textarea
                                    name="Task_description"
                                    value={formData.Task_description}
                                    onChange={handleChange}
                                    rows="6"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 mt-5">
                                    Plan (optional)
                                </label>
                                <select
                                    name="Task_plan"
                                    value={formData.Task_plan}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">— No plan —</option>
                                    {plans.map(plan => (
                                        <option
                                            key={plan.Plan_MVP_name}
                                            value={plan.Plan_MVP_name}
                                        >
                                            {plan.Plan_MVP_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-start gap-3 pt-6 mt-6 border-t">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                                >
                                    {loading ? "Creating..." : "Create Task"}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            {/* State Badge */}
                            <div className="mb-4">
                                <span
                                    className={`inline-block px-3 py-1 text-sm font-semibold uppercase ${getStateColor(
                                        task.Task_state
                                    )}`}
                                >
                                    {task.Task_state}
                                </span>
                            </div>

                            {/* Two-column layout */}
                            <div className="grid grid-cols-2 gap-6 mb-6 items-start">
                                {/* Left Column */}
                                <div className="space-y-4 tems-stretch">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Task Description:
                                        </label>
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {task.Task_description || ""}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">
                                                Owner:
                                            </span>{" "}
                                            <span className="text-gray-900">
                                                {task.Task_owner || ""}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">
                                                Creator:
                                            </span>{" "}
                                            <span className="text-gray-900">
                                                {task.Task_creator}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">
                                                Created On:
                                            </span>{" "}
                                            <span className="text-gray-900">
                                                {new Date(
                                                    task.Task_createDate
                                                ).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">
                                            Plan:
                                        </label>
                                        <select
                                            name="Task_plan"
                                            value={formData.Task_plan}
                                            onChange={e => {
                                                const newPlan = e.target.value;
                                                handleChange(e);
                                                handleUpdatePlan(newPlan);
                                            }}
                                            disabled={
                                                !canEditPlan() ||
                                                task.Task_state === "Doing" ||
                                                task.Task_state === "Closed"
                                            }
                                            className={`w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                !canEditPlan() ||
                                                task.Task_state === "Doing" ||
                                                task.Task_state === "Closed"
                                                    ? "bg-gray-100 cursor-not-allowed"
                                                    : ""
                                            }`}
                                        >
                                            <option value=""></option>
                                            {plans.map(plan => {
                                                const dateRange =
                                                    plan.Plan_startDate &&
                                                    plan.Plan_endDate
                                                        ? ` (${new Date(
                                                              plan.Plan_startDate
                                                          ).toLocaleDateString(
                                                              "en-GB",
                                                              {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric"
                                                              }
                                                          )} - ${new Date(
                                                              plan.Plan_endDate
                                                          ).toLocaleDateString(
                                                              "en-GB",
                                                              {
                                                                  day: "numeric",
                                                                  month: "short",
                                                                  year: "numeric"
                                                              }
                                                          )})`
                                                        : "";
                                                return (
                                                    <option
                                                        key={plan.Plan_MVP_name}
                                                        value={
                                                            plan.Plan_MVP_name
                                                        }
                                                    >
                                                        {plan.Plan_MVP_name}
                                                        {dateRange}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        {/* Action Buttons */}
                                        <div className="flex justify-start gap-3 pt-4">
                                            {canPromote() &&
                                                task.Task_state !==
                                                    "Closed" && (
                                                    <button
                                                        onClick={handlePromote}
                                                        disabled={loading}
                                                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                                                    >
                                                        {task.Task_state ===
                                                        "Open"
                                                            ? "Release Task"
                                                            : task.Task_state ===
                                                              "To-Do"
                                                            ? "Start Task"
                                                            : task.Task_state ===
                                                              "Doing"
                                                            ? "Request Task Review"
                                                            : task.Task_state ===
                                                              "Done"
                                                            ? "Approve Task"
                                                            : "Promote →"}
                                                    </button>
                                                )}
                                            {canDemote() &&
                                                task.Task_state !== "Open" && (
                                                    <button
                                                        onClick={handleDemote}
                                                        disabled={loading}
                                                        className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:bg-orange-400"
                                                    >
                                                        {task.Task_state ===
                                                        "Doing"
                                                            ? "Return Task"
                                                            : task.Task_state ===
                                                              "Done"
                                                            ? "Reject Task"
                                                            : "← Demote"}
                                                    </button>
                                                )}
                                        </div>
                                        {error && (
                                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                                                {error}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column */}
                                {/* Right Column */}
                                <div className="flex flex-col space-y-4 h-full">
                                    <div className="flex-1 flex flex-col">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Notes
                                        </label>
                                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-3 overflow-y-auto">
                                            {task.Task_notes ? (
                                                <div className="text-sm text-gray-700 whitespace-pre-wrap space-y-2">
                                                    {task.Task_notes}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">
                                                    No notes yet
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {canAddNotes() && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Entry
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleChange}
                                                rows="4"
                                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                placeholder="Insert Entry Here..."
                                            />
                                            <button
                                                onClick={handleAddNote}
                                                disabled={
                                                    loading ||
                                                    !formData.notes.trim()
                                                }
                                                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-gray-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                Add Note
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
