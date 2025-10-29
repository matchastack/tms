import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

const TaskModal = ({
    isOpen,
    onClose,
    onSuccess,
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
                notes: formData.notes,
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

    const handleUpdatePlan = async () => {
        if (!task) return;
        setError("");
        setLoading(true);

        try {
            const { data } = await axios.put("/tasks", {
                task_id: task.Task_id,
                plan_name: formData.Task_plan || null
            });

            if (data.success) {
                onSuccess();
                setError("");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update plan");
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
                notes: formData.notes || undefined
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
                notes: formData.notes || undefined
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
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isCreate ? "Create Task" : task.Task_id}
                        </h2>
                        {!isCreate && (
                            <span
                                className={`px-3 py-1 text-sm rounded-full ${getStateColor(
                                    task.Task_state
                                )}`}
                            >
                                {task.Task_state}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

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
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Task Name
                                </label>
                                <p className="text-gray-900 font-semibold">
                                    {task.Task_name}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {task.Task_description || "No description"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Creator
                                    </label>
                                    <p className="text-gray-700">
                                        {task.Task_creator}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Owner
                                    </label>
                                    <p className="text-gray-700">
                                        {task.Task_owner}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Created Date
                                </label>
                                <p className="text-gray-700">
                                    {new Date(
                                        task.Task_createDate
                                    ).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Plan
                                </label>
                                <div className="flex items-center gap-2">
                                    <select
                                        name="Task_plan"
                                        value={formData.Task_plan}
                                        onChange={handleChange}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">No Plan</option>
                                        {plans.map(plan => (
                                            <option
                                                key={plan.Plan_MVP_name}
                                                value={plan.Plan_MVP_name}
                                            >
                                                {plan.Plan_MVP_name}
                                            </option>
                                        ))}
                                    </select>
                                    {formData.Task_plan !== task.Task_plan && (
                                        <button
                                            onClick={handleUpdatePlan}
                                            disabled={loading}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                                        >
                                            Save
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Add Note
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Add notes for state transition..."
                                />
                            </div>

                            {task.Task_notes && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Audit Trail
                                    </label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                                        <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                            {task.Task_notes}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between gap-3 pt-4 border-t">
                                <div className="flex gap-2">
                                    {canDemote() &&
                                        task.Task_state !== "Open" && (
                                            <button
                                                onClick={handleDemote}
                                                disabled={loading}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400"
                                            >
                                                ← Demote
                                            </button>
                                        )}
                                    {canPromote() &&
                                        task.Task_state !== "Closed" && (
                                            <button
                                                onClick={handlePromote}
                                                disabled={loading}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                                            >
                                                Promote →
                                            </button>
                                        )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
