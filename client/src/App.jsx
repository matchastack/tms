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

    return (
        <>
            <div id="header">
                <Header />
            </div>
            <div id="login_form">
                <LoginPage onLoginSuccess={handleLoginSuccess} />
            </div>
        </>
    );
}

export default App;
