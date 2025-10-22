import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import Header from "./Header";

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

    if (password.length < minLength || password.length > maxLength) {
        return `Password must be between ${minLength} and ${maxLength} characters`;
    }

    if (!hasLetter) {
        return "Password must contain at least one letter";
    }

    if (!hasNumber) {
        return "Password must contain at least one number";
    }

    if (!hasSpecialChar) {
        return "Password must contain at least one special character";
    }

    return null;
};

const ProfilePage = () => {
    const { logout, user } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        currentPassword: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
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
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError("");

        if (formData.password) {
            if (!formData.currentPassword) {
                setError("Current password is required to change password");
                setTimeout(() => {
                    setError("");
                }, 5000);
                return;
            }

            if (formData.password !== formData.confirmPassword) {
                setError("Passwords do not match");
                setTimeout(() => {
                    setError("");
                }, 5000);
                return;
            }

            const passwordError = validatePassword(formData.password);
            if (passwordError) {
                setError(passwordError);
                setTimeout(() => {
                    setError("");
                }, 5000);
                return;
            }
        }

        setIsLoading(true);

        try {
            const updateData = {
                email: formData.email,
                userGroups: user.groups,
                isActive: 1
            };

            if (formData.password) {
                updateData.password = formData.password;
                updateData.currentPassword = formData.currentPassword;
            }

            await axios.put("/profile", {
                username: user.username,
                ...updateData
            });

            setFormData(prev => ({
                ...prev,
                currentPassword: "",
                password: "",
                confirmPassword: ""
            }));
        } catch (err) {
            const errorMessage = err.response?.data?.errors
                ? err.response.data.errors.join(", ")
                : err.response?.data?.message || "Failed to update profile";
            setError(errorMessage);
            setTimeout(() => {
                setError("");
            }, 5000);
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
                                Username
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
                                User Groups
                            </label>
                            <input
                                type="text"
                                value={user?.groups.join(", ") || ""}
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
                                placeholder="********"
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
                                placeholder="********"
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
                                placeholder="********"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                                {error}
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
