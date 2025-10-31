import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return navigate("/", { replace: true });
    }

    if (
        allowedRoles.length > 0 &&
        !user?.groups?.some(group => allowedRoles.includes(group))
    ) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-600">
                        You don't have permission to access this page.
                    </p>
                    <button
                        onClick={() => navigate("/", { replace: true })}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Back to Home Page
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
