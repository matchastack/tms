import { useAuth } from "./AuthContext";
import Header from "./Header";

const AppPage = () => {
    const { logout } = useAuth();

    const applications = [
        { id: 1, name: "Application #1" },
        { id: 2, name: "Application #2" },
        { id: 3, name: "Application #3" }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onLogout={logout} showLogout={true} />

            <main className="p-12">
                <h2 className="text-3xl font-semibold text-gray-900 mb-8">
                    Applications
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
                    {applications.map(app => (
                        <div
                            key={app.id}
                            className="bg-gray-100 p-8 rounded-lg cursor-pointer transition-all border border-transparent hover:bg-gray-200 hover:border-gray-300"
                        >
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {app.name}
                            </h3>
                            <p className="text-sm text-gray-600">Name:</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AppPage;
