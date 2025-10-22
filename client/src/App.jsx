import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "./LoginPage";
import AppPage from "./AppPage";
import UsersManagementPage from "./UsersManagementPage";
import ProfilePage from "./ProfilePage";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route
                        path="/apps"
                        element={
                            <ProtectedRoute>
                                <AppPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/user/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/user/accounts"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <UsersManagementPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
