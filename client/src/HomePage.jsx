import Header from "./Header";

const HomePage = ({ onLogout }) => {
    const applications = [
        { id: 1, name: "Application #1" },
        { id: 2, name: "Application #2" },
        { id: 3, name: "Application #3" }
    ];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
            <Header onLogout={onLogout} showLogout={true} />

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
