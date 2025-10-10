import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import Header from "./Header";

const UsersManagement = () => {
    const { logout, token } = useAuth();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [hasChanges, setHasChanges] = useState(false);

    const userGroups = ["Project Lead", "Project Manager", "Dev Team", "Admin"];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/accounts", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const data = await response.json();
            setUsers(
                data.data.map(user => ({
                    ...user,
                    originalActive: user.isActive
                }))
            );
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldChange = (index, field, value) => {
        const updatedUsers = [...users];
        updatedUsers[index] = { ...updatedUsers[index], [field]: value };
        setUsers(updatedUsers);
        setHasChanges(true);
    };

    const handleActiveToggle = index => {
        const updatedUsers = [...users];
        updatedUsers[index] = {
            ...updatedUsers[index],
            isActive: updatedUsers[index].isActive === 1 ? 0 : 1
        };
        setUsers(updatedUsers);
        setHasChanges(true);
    };

    const addNewRow = () => {
        setUsers([
            ...users,
            {
                id: null,
                username: "",
                email: "",
                userGroup: "Dev Team",
                password: "",
                isActive: 1,
                isNew: true
            }
        ]);
        setHasChanges(true);
    };

    const handleSaveChanges = async () => {
        console.log("Saving changes:", users);
        setHasChanges(false);
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
            <Header
                onLogout={logout}
                showLogout={true}
                title="Users Management"
            />

            <main className="p-12 px-8">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    User ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    User Group
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Password
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Active
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr
                                    key={user.id || `new-${index}`}
                                    className="border-b border-gray-200"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {user.id || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
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
                                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        <select
                                            value={user.userGroup}
                                            onChange={e =>
                                                handleFieldChange(
                                                    index,
                                                    "userGroup",
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none bg-white cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2012%2012%22%3E%3Cpath%20fill=%22%236b7280%22%20d=%22M10.293%203.293L6%207.586%201.707%203.293A1%201%200%2000.293%204.707l5%205a1%201%200%20001.414%200l5-5a1%201%200%2010-1.414-1.414z%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                                    <td className="px-4 py-3 text-sm text-gray-900">
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
                                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900">
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
                                                user.isNew ? "" : "••••••••"
                                            }
                                            className="w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                        <input
                                            type="checkbox"
                                            checked={user.isActive === 1}
                                            onChange={() =>
                                                handleActiveToggle(index)
                                            }
                                            className="w-[18px] h-[18px] cursor-pointer accent-indigo-600"
                                        />
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="6" className="px-3 py-3">
                                    <button
                                        onClick={addNewRow}
                                        className="bg-transparent text-indigo-600 border-none cursor-pointer text-sm font-medium hover:text-indigo-700"
                                    >
                                        + Add New User
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveChanges}
                        disabled={!hasChanges}
                        className={`px-8 py-3 rounded-lg border-none text-sm font-semibold text-white transition-colors ${
                            hasChanges
                                ? "bg-green-500 hover:bg-green-600 cursor-pointer"
                                : "bg-gray-300 cursor-not-allowed"
                        }`}
                    >
                        Save Changes
                    </button>
                </div>
            </main>
        </div>
    );
};

export default UsersManagement;
