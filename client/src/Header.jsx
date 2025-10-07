const Header = () => {
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
    );
};

export default Header;
