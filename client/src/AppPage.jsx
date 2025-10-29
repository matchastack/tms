import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Header from "./Header";
import MultiSelect from "./MultiSelect";
import axios from "axios";

const AppPage = () => {
    const { logout, user } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editedRows, setEditedRows] = useState(new Set());
    const [availableGroups, setAvailableGroups] = useState([]);

    useEffect(() => {
        fetchApplications();
        fetchGroups();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get("/applications");
            if (data.success) {
                const existingApps = data.data.map(app => ({
                    ...app,
                    App_permit_Create: Array.isArray(app.App_permit_Create)
                        ? app.App_permit_Create
                        : [],
                    App_permit_Open: Array.isArray(app.App_permit_Open)
                        ? app.App_permit_Open
                        : [],
                    App_permit_toDoList: Array.isArray(app.App_permit_toDoList)
                        ? app.App_permit_toDoList
                        : [],
                    App_permit_Doing: Array.isArray(app.App_permit_Doing)
                        ? app.App_permit_Doing
                        : [],
                    App_permit_Done: Array.isArray(app.App_permit_Done)
                        ? app.App_permit_Done
                        : [],
                    App_Rnumber: app.App_Rnumber ?? 0,
                    error: ""
                }));

                setApplications([
                    {
                        App_Acronym: "",
                        App_Description: "",
                        App_startDate: "",
                        App_endDate: "",
                        App_permit_Create: [],
                        App_permit_Open: [],
                        App_permit_toDoList: [],
                        App_permit_Doing: [],
                        App_permit_Done: [],
                        App_Rnumber: 0,
                        isNew: true,
                        error: ""
                    },
                    ...existingApps
                ]);

                setEditedRows(new Set());
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load applications"
            );
            setTimeout(() => setError(""), 5000);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const { data } = await axios.get("/user_groups");
            setAvailableGroups(data.data);
        } catch (err) {
            console.error("Failed to fetch groups:", err);
        }
    };

    const formatDateForInput = dateString => {
        if (!dateString) return "";
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
        // Otherwise, parse and format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const handleFieldChange = (index, field, value) => {
        setError("");
        const updatedApps = [...applications];
        updatedApps[index] = {
            ...updatedApps[index],
            [field]: value
        };
        setApplications(updatedApps);

        const newEditedRows = new Set(editedRows);
        newEditedRows.add(index);
        setEditedRows(newEditedRows);
    };

    const handleSaveRow = async index => {
        const app = applications[index];

        try {
            if (app.isNew) {
                // Validate required fields
                if (!app.App_Acronym.trim()) {
                    const updatedApps = [...applications];
                    updatedApps[index] = {
                        ...app,
                        error: "Application acronym is required"
                    };
                    setApplications(updatedApps);
                    setTimeout(() => {
                        const clearedApps = [...applications];
                        clearedApps[index] = {
                            ...clearedApps[index],
                            error: ""
                        };
                        setApplications(clearedApps);
                    }, 5000);
                    return;
                }

                // Validate all permission fields have at least one group
                const permissionFields = [
                    { field: app.App_permit_Create, name: "Create" },
                    { field: app.App_permit_Open, name: "Open" },
                    { field: app.App_permit_toDoList, name: "To Do" },
                    { field: app.App_permit_Doing, name: "Doing" },
                    { field: app.App_permit_Done, name: "Done" }
                ];

                for (const perm of permissionFields) {
                    if (!Array.isArray(perm.field) || perm.field.length === 0) {
                        const updatedApps = [...applications];
                        updatedApps[index] = {
                            ...app,
                            error: `${perm.name} permission must have at least one group`
                        };
                        setApplications(updatedApps);
                        setTimeout(() => {
                            const clearedApps = [...applications];
                            clearedApps[index] = {
                                ...clearedApps[index],
                                error: ""
                            };
                            setApplications(clearedApps);
                        }, 5000);
                        return;
                    }
                }

                await axios.post("/applications", {
                    App_Acronym: app.App_Acronym.trim(),
                    App_Description: app.App_Description.trim(),
                    App_startDate: app.App_startDate || null,
                    App_endDate: app.App_endDate || null,
                    App_permit_Create: app.App_permit_Create,
                    App_permit_Open: app.App_permit_Open,
                    App_permit_toDoList: app.App_permit_toDoList,
                    App_permit_Doing: app.App_permit_Doing,
                    App_permit_Done: app.App_permit_Done
                });

                await fetchApplications();
            } else {
                // Validate permission fields for updates
                const permissionFields = [
                    { field: app.App_permit_Create, name: "Create" },
                    { field: app.App_permit_Open, name: "Open" },
                    { field: app.App_permit_toDoList, name: "To Do" },
                    { field: app.App_permit_Doing, name: "Doing" },
                    { field: app.App_permit_Done, name: "Done" }
                ];

                for (const perm of permissionFields) {
                    if (!Array.isArray(perm.field) || perm.field.length === 0) {
                        const updatedApps = [...applications];
                        updatedApps[index] = {
                            ...app,
                            error: `${perm.name} permission must have at least one group`
                        };
                        setApplications(updatedApps);
                        setTimeout(() => {
                            const clearedApps = [...applications];
                            clearedApps[index] = {
                                ...clearedApps[index],
                                error: ""
                            };
                            setApplications(clearedApps);
                        }, 5000);
                        return;
                    }
                }

                await axios.put(`/applications/${app.App_Acronym}`, {
                    App_Description: app.App_Description.trim(),
                    App_startDate: app.App_startDate || null,
                    App_endDate: app.App_endDate || null,
                    App_permit_Create: app.App_permit_Create,
                    App_permit_Open: app.App_permit_Open,
                    App_permit_toDoList: app.App_permit_toDoList,
                    App_permit_Doing: app.App_permit_Doing,
                    App_permit_Done: app.App_permit_Done
                });

                const newEditedRows = new Set(editedRows);
                newEditedRows.delete(index);
                setEditedRows(newEditedRows);
            }
        } catch (err) {
            const updatedApps = [...applications];
            updatedApps[index] = {
                ...app,
                error: err.response?.data?.message || err.message
            };
            setApplications(updatedApps);
            setTimeout(() => {
                const clearedApps = [...applications];
                clearedApps[index] = { ...clearedApps[index], error: "" };
                setApplications(clearedApps);
            }, 5000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header onLogout={logout} showLogout={true} />
                <div className="p-12 text-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onLogout={logout} showLogout={true} />

            <main className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Applications
                </h2>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm overflow-x-auto border border-gray-200">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Acronym
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Start Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    End Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Create
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Open
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    To Do
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Doing
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Done
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Tasks
                                </th>
                                <th className="px-4 py-3 border-b border-gray-200"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {applications.map((app, index) => (
                                <>
                                    <tr
                                        key={
                                            app.isNew
                                                ? "new-app"
                                                : app.App_Acronym
                                        }
                                        className="border-b border-gray-100"
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={app.App_Acronym}
                                                onChange={e =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_Acronym",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={
                                                    app.isNew ? "Acronym" : ""
                                                }
                                                disabled={!app.isNew}
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${
                                                    app.isNew
                                                        ? "focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                        : "bg-gray-100 cursor-not-allowed"
                                                }`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={app.App_Description}
                                                onChange={e =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_Description",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={
                                                    app.isNew
                                                        ? "Description"
                                                        : ""
                                                }
                                                disabled={!app.isNew}
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${
                                                    app.isNew
                                                        ? "focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                        : "bg-gray-100 cursor-not-allowed"
                                                }`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="date"
                                                value={formatDateForInput(
                                                    app.App_startDate
                                                )}
                                                onChange={e =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_startDate",
                                                        e.target.value
                                                    )
                                                }
                                                disabled={!app.isNew}
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${
                                                    app.isNew
                                                        ? "focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                        : "bg-gray-100 cursor-not-allowed"
                                                }`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="date"
                                                value={formatDateForInput(
                                                    app.App_endDate
                                                )}
                                                onChange={e =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_endDate",
                                                        e.target.value
                                                    )
                                                }
                                                disabled={!app.isNew}
                                                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${
                                                    app.isNew
                                                        ? "focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                        : "bg-gray-100 cursor-not-allowed"
                                                }`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <MultiSelect
                                                value={app.App_permit_Create}
                                                onChange={value =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_permit_Create",
                                                        value
                                                    )
                                                }
                                                placeholder={
                                                    app.isNew ? "Select..." : ""
                                                }
                                                availableGroups={
                                                    availableGroups
                                                }
                                                disabled={!app.isNew}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <MultiSelect
                                                value={app.App_permit_Open}
                                                onChange={value =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_permit_Open",
                                                        value
                                                    )
                                                }
                                                placeholder={
                                                    app.isNew ? "Select..." : ""
                                                }
                                                availableGroups={
                                                    availableGroups
                                                }
                                                disabled={!app.isNew}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <MultiSelect
                                                value={app.App_permit_toDoList}
                                                onChange={value =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_permit_toDoList",
                                                        value
                                                    )
                                                }
                                                placeholder={
                                                    app.isNew ? "Select..." : ""
                                                }
                                                availableGroups={
                                                    availableGroups
                                                }
                                                disabled={!app.isNew}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <MultiSelect
                                                value={app.App_permit_Doing}
                                                onChange={value =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_permit_Doing",
                                                        value
                                                    )
                                                }
                                                placeholder={
                                                    app.isNew ? "Select..." : ""
                                                }
                                                availableGroups={
                                                    availableGroups
                                                }
                                                disabled={!app.isNew}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <MultiSelect
                                                value={app.App_permit_Done}
                                                onChange={value =>
                                                    handleFieldChange(
                                                        index,
                                                        "App_permit_Done",
                                                        value
                                                    )
                                                }
                                                placeholder={
                                                    app.isNew ? "Select..." : ""
                                                }
                                                availableGroups={
                                                    availableGroups
                                                }
                                                disabled={!app.isNew}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">
                                            {app.App_Rnumber ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {app.isNew ? (
                                                <button
                                                    onClick={() =>
                                                        handleSaveRow(index)
                                                    }
                                                    className="px-6 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-green-500 transition-colors"
                                                >
                                                    Add
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                    {app.error && (
                                        <tr>
                                            <td
                                                colSpan="11"
                                                className="px-4 py-2 bg-red-50 border-b border-gray-200"
                                            >
                                                <div className="text-sm text-red-600">
                                                    {app.error}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default AppPage;
