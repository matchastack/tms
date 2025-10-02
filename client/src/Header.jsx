const Header = ({ title = "Task Management System" }) => {
    return (
        <header
            style={{
                backgroundColor: "white",
                borderBottom: "2px solid black",
                padding: "1rem 1.5rem",
            }}
        >
            <div style={{ textAlign: "left" }}>
                <h1
                    style={{
                        fontSize: "1.875rem",
                        fontWeight: "bold",
                        color: "#111827",
                    }}
                >
                    {title}
                </h1>
            </div>
        </header>
    );
};

export default Header;
