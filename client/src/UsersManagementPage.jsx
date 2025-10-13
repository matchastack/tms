import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import Header from "./Header";

const UsersManagement = () => {
    const { logout, token } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [editedRows, setEditedRows] = useState(new Set());

    const userGroups = ["project lead", "project manager", "dev team", "admin"];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get("/accounts");
            const fetchedUsers = data.data.map(user => ({
                ...user,
                originalActive: user.isActive
            }));

            const newUserRow = {
                id: null,
                username: "",
                email: "",
                userGroup: "dev team",
                password: "",
                isActive: 1,
                isNew: true
            };

            setUsers([newUserRow, ...fetchedUsers]);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (index, field, value) => {
        const updatedUsers = [...users];
        updatedUsers[index] = { ...updatedUsers[index], [field]: value };
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

                const { data } = await axios.post("/accounts", {
                    username: user.username,
                    email: user.email,
                    password: user.password,
                    userGroup: user.userGroup
                });

                setError("");
                await fetchUsers();
            } else {
                const { data } = await axios.put(`/accounts/${user.id}`, {
                    username: user.username,
                    email: user.email,
                    password: user.password || undefined,
                    userGroup: user.userGroup,
                    isActive: user.isActive
                });

                setError("");
                const newEditedRows = new Set(editedRows);
                newEditedRows.delete(index);
                setEditedRows(newEditedRows);
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
                                    User ID
                                </th>
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
                            {users.map((user, index) => (
                                <tr
                                    key={user.id || `new-${index}`}
                                    className="border-b border-gray-100"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {user.id || "—"}
                                    </td>
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
                                                user.isNew ? "new username" : ""
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={user.userGroup}
                                            onChange={e =>
                                                handleFieldChange(
                                                    index,
                                                    "userGroup",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none bg-white cursor-pointer focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {userGroups.map(group => (
                                                <option
                                                    key={group}
                                                    value={group}
                                                >
                                                    {group}
                                                </option>
                                            ))}
                                        </select>
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
                                                    ? "8-10 chars only"
                                                    : "(leave blank to keep)"
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
                                                        user.isActive === 1
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
                                    <td className="px-4 py-3 text-right">
                                        {index === 0 && user.isNew ? (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default UsersManagement;
