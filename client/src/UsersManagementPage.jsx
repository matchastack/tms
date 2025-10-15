import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import Header from "./Header";

const UsersManagementPage = () => {
    const { logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [editedRows, setEditedRows] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const { data } = await axios.get("/accounts");
            setUsers([
                ...data.data,
                {
                    username: "",
                    email: "",
                    password: "",
                    userGroup: "",
                    isActive: 1,
                    isNew: true
                }
            ]);
            setEditedRows(new Set());
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (index, field, value) => {
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

        try {
            if (user.isNew) {
                if (
                    !user.username ||
                    !user.email ||
                    !user.password ||
                    !user.userGroup
                ) {
                    setError("All fields are required for new user");
                    return;
                }

                await axios.post("/accounts", {
                    username: user.username,
                    email: user.email,
                    password: user.password,
                    userGroup: user.userGroup
                });

                setError("");
                await fetchUsers();
            } else {
                const updateData = {
                    email: user.email,
                    userGroup: user.userGroup,
                    isActive: user.isActive
                };

                if (user.password) {
                    updateData.password = user.password;
                }

                // Check if username was changed
                if (
                    user.originalUsername &&
                    user.originalUsername !== user.username
                ) {
                    updateData.newUsername = user.username;
                }

                await axios.put(
                    `/accounts/${user.originalUsername || user.username}`,
                    updateData
                );

                setError("");
                const newEditedRows = new Set(editedRows);
                newEditedRows.delete(index);
                setEditedRows(newEditedRows);

                // Update originalUsername after successful save
                const updatedUsers = [...users];
                updatedUsers[index] = {
                    ...updatedUsers[index],
                    originalUsername: user.username,
                    password: "" // Clear password after save
                };
                setUsers(updatedUsers);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
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

                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    Username
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                                    User Group
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
                                // Store original username for existing users
                                if (!user.isNew && !user.originalUsername) {
                                    user.originalUsername = user.username;
                                }

                                return (
                                    <tr
                                        key={
                                            user.originalUsername ||
                                            user.username ||
                                            `new-${index}`
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
                                                    user.isNew ? "Username" : ""
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
                                            <input
                                                type="text"
                                                value={user.userGroup}
                                                onChange={e =>
                                                    handleFieldChange(
                                                        index,
                                                        "userGroup",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={
                                                    user.isNew
                                                        ? "User Group"
                                                        : ""
                                                }
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                                            <button
                                                onClick={() =>
                                                    handleActiveToggle(index)
                                                }
                                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                                    user.isActive === 1
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {user.isActive === 1
                                                    ? "Active"
                                                    : "Inactive"}
                                            </button>
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
                                                        !editedRows.has(index)
                                                    }
                                                    className={`px-8 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        editedRows.has(index)
                                                            ? "!bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                                                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    }`}
                                                >
                                                    Save
                                                </button>
                                            )}
                                        </td>
                                    </tr>
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
