import { useState } from "react";

const Header = ({
    title = "Task Management System",
    onLogout,
    showLogout = false
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:8080/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            onLogout();
        }
    };

    return (
        <header
            style={{
                backgroundColor: "white",
                borderBottom: "2px solid #e5e7eb",
                padding: "1.5rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}
        >
            <h1
                style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#111827",
                    margin: 0
                }}
            >
                {title}
            </h1>

            {showLogout && (
                <div style={{ position: "relative" }}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "50%",
                            backgroundColor: "#d1d5db",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            border: "none",
                            transition: "background-color 0.2s"
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = "#9ca3af";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "#d1d5db";
                        }}
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
                        <div
                            style={{
                                position: "absolute",
                                top: "100%",
                                right: 0,
                                marginTop: "0.5rem",
                                backgroundColor: "white",
                                borderRadius: "0.5rem",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                minWidth: "200px",
                                zIndex: 50
                            }}
                        >
                            <div
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderBottom: "1px solid #e5e7eb"
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                        color: "#111827",
                                        margin: 0
                                    }}
                                >
                                    {user.name || "User"}
                                </p>
                                <p
                                    style={{
                                        fontSize: "0.75rem",
                                        color: "#6b7280",
                                        margin: "0.25rem 0 0 0"
                                    }}
                                >
                                    {user.email || ""}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem",
                                    textAlign: "left",
                                    fontSize: "0.875rem",
                                    color: "#dc2626",
                                    border: "none",
                                    backgroundColor: "transparent",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor =
                                        "#fef2f2";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor =
                                        "transparent";
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
};

export default Header;
