const HomePage = () => {
    const applications = [
        { id: 1, name: "Application #1" },
        { id: 2, name: "Application #2" },
        { id: 3, name: "Application #3" }
    ];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
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
                    Task Management System
                </h1>

                <div
                    style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        backgroundColor: "#d1d5db",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
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
                </div>
            </header>

            <main style={{ padding: "3rem 2rem" }}>
                <h2
                    style={{
                        fontSize: "1.875rem",
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: "2rem"
                    }}
                >
                    Applications
                </h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "2rem",
                        maxWidth: "1200px"
                    }}
                >
                    {applications.map(app => (
                        <div
                            key={app.id}
                            style={{
                                backgroundColor: "#f3f4f6",
                                padding: "2rem",
                                borderRadius: "0.5rem",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                border: "1px solid transparent"
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor =
                                    "#e5e7eb";
                                e.currentTarget.style.borderColor = "#d1d5db";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor =
                                    "#f3f4f6";
                                e.currentTarget.style.borderColor =
                                    "transparent";
                            }}
                        >
                            <h3
                                style={{
                                    fontSize: "1.125rem",
                                    fontWeight: "600",
                                    color: "#111827",
                                    marginBottom: "1rem"
                                }}
                            >
                                {app.name}
                            </h3>
                            <p
                                style={{
                                    fontSize: "0.875rem",
                                    color: "#6b7280",
                                    margin: 0
                                }}
                            >
                                Name:
                            </p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default HomePage;
