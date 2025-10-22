import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const getMenuOptions = userGroups => {
    const allOptions = {
        apps: {
            label: "Applications",
            path: "/apps",
            icon: (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            )
        },
        users: {
            label: "Users Management",
            path: "/user/accounts",
            icon: (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        },
        profile: {
            label: "Profile",
            path: "/user/profile",
            icon: (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            )
        }
    };

    let options = new Set([allOptions.profile]);
    for (const userGroup of userGroups) {
        if (userGroup === "admin") {
            options.add(allOptions.users);
        }

        if (
            userGroup === "project lead" ||
            userGroup === "dev team" ||
            userGroup === "project manager"
        ) {
            options.add(allOptions.apps);
        }
    }
    options = Array.from(options);
    options.sort((a, b) => a.label.localeCompare(b.label));
    return options;
};

const Header = ({
    title = "Task Management System",
    onLogout,
    showLogout = false
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const menuOptions = getMenuOptions(user?.groups);

    const handleLogout = async () => {
        await onLogout();
    };

    const handleMenuClick = path => {
        navigate(path);
        setShowMenu(false);
    };

    return (
        <header className="bg-white border-b-2 border-gray-200 px-8 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 m-0">{title}</h1>

            {showLogout && (
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer border-none transition-colors hover:bg-gray-400"
                    >
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#6b7280"
                            strokeWidth="2"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>

                    {showMenu && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg min-w-[200px] z-50">
                            <div className="py-1">
                                {menuOptions.map(option => (
                                    <button
                                        key={option.path}
                                        onClick={() =>
                                            handleMenuClick(option.path)
                                        }
                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 border-none bg-transparent cursor-pointer transition-colors hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        {option.icon}
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-gray-200">
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 text-left text-sm text-red-600 border-none bg-transparent cursor-pointer transition-colors hover:bg-red-50"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;
