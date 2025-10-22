import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import Header from "./Header";
import MultiSelect from "./MultiSelect";

const ROOT_ADMIN_USERNAME = "admin";

const validatePassword = password => {
    const minLength = 8;
    const maxLength = 10;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        password
    );

    if (!password) {
        return "Password is required";
    }

    if (
        password.length < minLength ||
        password.length > maxLength ||
        !hasLetter ||
        !hasNumber ||
        !hasSpecialChar
    ) {
        return `Password must be between ${minLength}-${maxLength} characters long and include at least one letter, one number, and one special character`;
    }

    return null;
};

const AVAILABLE_GROUPS_INITIAL = [];

const UsersManagementPage = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [editedRows, setEditedRows] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [availableGroups, setAvailableGroups] = useState(
        AVAILABLE_GROUPS_INITIAL
    );
    const [newGroupName, setNewGroupName] = useState("");
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchGroups();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const { data } = await axios.get("/accounts");
            const existingUsers = data.data
                .map(user => ({
                    ...user,
                    userGroups: Array.isArray(user.userGroups)
                        ? user.userGroups
                        : [],
                    error: ""
                }))
                .sort((a, b) =>
                    a.username === ROOT_ADMIN_USERNAME
                        ? -1
                        : b.username === ROOT_ADMIN_USERNAME
                        ? 1
                        : a.username.localeCompare(b.username)
                );
            setUsers([
                {
                    username: "",
                    email: "",
                    password: "",
                    userGroups: [],
                    isActive: 1,
                    isNew: true,
                    error: ""
                },
                ...existingUsers
            ]);
            setEditedRows(new Set());
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch users");
        } finally {
            setIsLoading(false);
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

    const handleFieldChange = (index, field, value) => {
        setError("");
        const updatedUsers = [...users];
        updatedUsers[index] = {
            ...updatedUsers[index],
            [field]: value
        };
        setUsers(updatedUsers);

        const newEditedRows = new Set(editedRows);
        newEditedRows.add(index);
        setEditedRows(newEditedRows);
    };

    const handleActiveToggle = index => {
        const updatedUsers = [...users];
        updatedUsers[index] = {
            ...updatedUsers[index],
            isActive: updatedUsers[index].isActive === 1 ? 0 : 1
        };
        setUsers(updatedUsers);

        const newEditedRows = new Set(editedRows);
        newEditedRows.add(index);
        setEditedRows(newEditedRows);
    };

    const handleSaveRow = async index => {
        const user = users[index];
        if (user.username === ROOT_ADMIN_USERNAME && !user.isNew) {
            if (user.isActive === 0) {
                const updatedUsers = [...users];
                updatedUsers[index] = {
                    ...user,
                    error: "Cannot deactivate the original admin"
                };
                setUsers(updatedUsers);
                return;
            }
            if (!user.userGroups.includes("admin")) {
                const updatedUsers = [...users];
                updatedUsers[index] = {
                    ...user,
                    error: "Cannot remove admin group from original admin"
                };
                setUsers(updatedUsers);
                return;
            }
        }

        try {
            if (user.isNew) {
                if (!user.username || !user.email || !user.password) {
                    const updatedUsers = [...users];
                    updatedUsers[index] = {
                        ...user,
                        error: "Field(s) cannot be empty"
                    };
                    setUsers(updatedUsers);
                    return;
                }

                const passwordError = validatePassword(user.password);
                if (passwordError) {
                    const updatedUsers = [...users];
                    updatedUsers[index] = { ...user, error: passwordError };
                    setUsers(updatedUsers);
                    return;
                }

                await axios.post("/accounts", {
                    username: user.username.trim().toLowerCase(),
                    email: user.email.trim(),
                    password: user.password,
                    userGroups: user.userGroups,
                    isActive: user.isActive
                });

                await fetchUsers();
            } else {
                const updateData = {
                    email: user.email.trim(),
                    userGroups: user.userGroups,
                    isActive: user.isActive
                };

                if (user.password) {
                    const passwordError = validatePassword(user.password);
                    if (passwordError) {
                        const updatedUsers = [...users];
                        updatedUsers[index] = { ...user, error: passwordError };
                        setUsers(updatedUsers);
                        return;
                    }
                    updateData.password = user.password;
                }

                await axios.put("/accounts", {
                    username: user.username,
                    ...updateData
                });

                const newEditedRows = new Set(editedRows);
                newEditedRows.delete(index);
                setEditedRows(newEditedRows);

                const updatedUsers = [...users];
                updatedUsers[index] = {
                    ...updatedUsers[index],
                    password: "" // Clear password after save
                };
                setUsers(updatedUsers);
            }
        } catch (err) {
            const updatedUsers = [...users];
            updatedUsers[index] = {
                ...user,
                error: err.response?.data?.message || err.message
            };
            setUsers(updatedUsers);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            return;
        }

        setIsCreatingGroup(true);
        try {
            await axios.post("/user_groups", {
                groupName: newGroupName.trim().toLowerCase()
            });
            await fetchGroups();
            setNewGroupName("");
            setError("");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create group");
        } finally {
            setIsCreatingGroup(false);
        }
    };

    if (isLoading) {
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
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        User Management
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm overflow-visible border border-gray-200">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Username
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b  border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                            Groups
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={newGroupName}
                                                onChange={e =>
                                                    setNewGroupName(
                                                        e.target.value
                                                    )
                                                }
                                                onKeyDown={e => {
                                                    if (e.key === "Enter") {
                                                        handleCreateGroup();
                                                    }
                                                }}
                                                placeholder="new group"
                                                className="px-2 py-1 text-xs border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={isCreatingGroup}
                                            />
                                            <button
                                                onClick={handleCreateGroup}
                                                disabled={
                                                    isCreatingGroup ||
                                                    !newGroupName.trim()
                                                }
                                                className="px-2 py-1 text-xs !bg-green-400 text-black rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {isCreatingGroup
                                                    ? "..."
                                                    : "Add"}
                                            </button>
                                        </div>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Password
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Active
                                </th>
                                <th className="px-4 py-3 border-b border-gray-200"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {users.map((user, index) => {
                                return (
                                    <>
                                        <tr
                                            key={
                                                user.isNew
                                                    ? "new-user"
                                                    : user.originalUsername
                                            }
                                            className="border-b border-gray-100"
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={user.username}
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            index,
                                                            "username",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={
                                                        user.isNew
                                                            ? "Username"
                                                            : ""
                                                    }
                                                    disabled={!user.isNew}
                                                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none ${
                                                        user.isNew
                                                            ? "focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                            : "bg-gray-100 cursor-not-allowed"
                                                    }`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <MultiSelect
                                                    value={user.userGroups}
                                                    onChange={value =>
                                                        handleFieldChange(
                                                            index,
                                                            "userGroups",
                                                            value
                                                        )
                                                    }
                                                    placeholder={
                                                        user.isNew
                                                            ? "Select groups..."
                                                            : ""
                                                    }
                                                    availableGroups={
                                                        availableGroups
                                                    }
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="email"
                                                    value={user.email}
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            index,
                                                            "email",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={
                                                        user.isNew
                                                            ? "user@example.com"
                                                            : ""
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="password"
                                                    value={user.password || ""}
                                                    onChange={e =>
                                                        handleFieldChange(
                                                            index,
                                                            "password",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder={
                                                        user.isNew
                                                            ? "Password"
                                                            : "Leave blank"
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                user.isActive ===
                                                                1
                                                            }
                                                            onChange={() =>
                                                                handleActiveToggle(
                                                                    index
                                                                )
                                                            }
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                                                        <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                                                    </div>
                                                </label>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {user.isNew ? (
                                                    <button
                                                        onClick={() =>
                                                            handleSaveRow(index)
                                                        }
                                                        className="px-6 py-2 !bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-green-500 transition-colors"
                                                    >
                                                        Add User
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleSaveRow(index)
                                                        }
                                                        disabled={
                                                            !editedRows.has(
                                                                index
                                                            )
                                                        }
                                                        className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${
                                                            editedRows.has(
                                                                index
                                                            )
                                                                ? "!bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                        }`}
                                                    >
                                                        Save
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {user.error && (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-4 py-2 bg-red-50 border-b border-gray-200"
                                                >
                                                    <div className="text-sm text-red-600">
                                                        {user.error}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default UsersManagementPage;
