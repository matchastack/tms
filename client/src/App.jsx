import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import UsersManagement from "./UsersManagement";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        isLoggedIn ? (
                            <Navigate to="/home" replace />
                        ) : (
                            <LoginPage onLoginSuccess={handleLoginSuccess} />
                        )
                    }
                />
                <Route
                    path="/home"
                    element={
                        isLoggedIn ? (
                            <HomePage onLogout={handleLogout} />
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route
                    path="/manage/accounts"
                    element={<UsersManagement onLogout={handleLogout} />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
