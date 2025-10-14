import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";
import Header from "./Header";

const ProfilePage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        currentPassword: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.name || "",
                email: user.email || ""
            }));
        }
    }, [user]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError("");
        setSuccess("");
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (
            formData.password &&
            formData.password !== formData.confirmPassword
        ) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password && formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (formData.password && !formData.currentPassword) {
            setError("Current password is required to change password");
            return;
        }

        setIsLoading(true);

        try {
            const updateData = {
                username: formData.username,
                email: formData.email,
                userGroup: user.group,
                isActive: user.isActive
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            await axios.put(`/accounts/${user.id}`, updateData);

            setSuccess("Profile updated successfully");
            setFormData(prev => ({
                ...prev,
                currentPassword: "",
                password: "",
                confirmPassword: ""
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onLogout={logout} showLogout={true} />

            <main className="flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                        Update Profile
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                value={user?.username || ""}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User Group
                            </label>
                            <input
                                type="text"
                                value={user?.group || ""}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Required to change password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Leave blank to keep current"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-md text-sm">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full !bg-gray-900 text-white py-3 rounded-md font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Updating..." : "Submit"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
