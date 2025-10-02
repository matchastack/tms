import "./App.css";
import Header from "./Header";
import LoginPage from "./LoginPage";

function App() {
    return (
        <>
            <div id="header">
                <Header />
            </div>
            <div id="login_form">
                <LoginPage />
            </div>
        </>
    );
}

export default App;
