import { useState } from "react";

const LoginPage = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(true);

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            localStorage.setItem("token", data.data.token);
            localStorage.setItem("user", JSON.stringify(data.data.user));

            onLoginSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f3f4f6",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <header
                style={{
                    backgroundColor: "white",
                    borderBottom: "3px solid #3b82f6",
                    padding: "1.5rem 2rem"
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
                    Task Management System
                </h1>
            </header>

            <main
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem"
                }}
            >
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "0.5rem",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                        padding: "3rem",
                        width: "100%",
                        maxWidth: "400px"
                    }}
                >
                    <h2
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: "600",
                            color: "#111827",
                            textAlign: "center",
                            marginBottom: "2rem"
                        }}
                    >
                        Login
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    color: "#374151",
                                    marginBottom: "0.5rem"
                                }}
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Value"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "0.375rem",
                                    fontSize: "0.875rem",
                                    outline: "none",
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={e =>
                                    (e.target.style.borderColor = "#3b82f6")
                                }
                                onBlur={e =>
                                    (e.target.style.borderColor = "#d1d5db")
                                }
                            />
                        </div>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    color: "#374151",
                                    marginBottom: "0.5rem"
                                }}
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Value"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    border: "1px solid #d1d5db",
                                    borderRadius: "0.375rem",
                                    fontSize: "0.875rem",
                                    outline: "none",
                                    transition: "border-color 0.2s"
                                }}
                                onFocus={e =>
                                    (e.target.style.borderColor = "#3b82f6")
                                }
                                onBlur={e =>
                                    (e.target.style.borderColor = "#d1d5db")
                                }
                            />
                        </div>

                        {error && (
                            <div
                                style={{
                                    backgroundColor: "#fee2e2",
                                    color: "#dc2626",
                                    padding: "0.75rem",
                                    borderRadius: "0.375rem",
                                    fontSize: "0.875rem",
                                    marginBottom: "1.5rem"
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: "100%",
                                backgroundColor: "#1f2937",
                                color: "white",
                                padding: "0.75rem",
                                borderRadius: "0.375rem",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                border: "none",
                                cursor: isLoading ? "not-allowed" : "pointer",
                                opacity: isLoading ? 0.6 : 1,
                                transition: "background-color 0.2s"
                            }}
                            onMouseEnter={e => {
                                if (!isLoading)
                                    e.target.style.backgroundColor = "#374151";
                            }}
                            onMouseLeave={e => {
                                if (!isLoading)
                                    e.target.style.backgroundColor = "#1f2937";
                            }}
                        >
                            {isLoading ? "Logging in..." : "Log In"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;
