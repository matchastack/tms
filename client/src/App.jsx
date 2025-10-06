import { useState } from "react";
import "./App.css";
import Header from "./Header";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    if (isLoggedIn) {
        return <HomePage />;
    }

    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
}

export default App;
