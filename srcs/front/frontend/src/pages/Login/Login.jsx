import { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import styles from "./Login.module.css";

const Login = () => {
    const { setAuthTokens, setUser } = useContext(AuthContext);
    const [displayError, setDisplayError] = useState("");
    const navigate = useNavigate();

    const loginUser = async (e) => {
        e.preventDefault();
        setDisplayError(""); // Clear any previous errors

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'username': e.target.username.value, 
                    'password': e.target.password.value
                })
            });

            const data = await response.json();

            if (response.status === 200) {
                // Set auth tokens and user
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                // Store tokens in local storage
                localStorage.setItem('authTokens', JSON.stringify(data));
                // Navigate to home page
                navigate('/');
            } else {
                // Display error message from the server or a generic error
                setDisplayError(data.detail || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            setDisplayError("An error occurred. Please try again.");
            console.error("Login error:", error);
        }
    }

    return (
        <div>
            <form onSubmit={loginUser} className={styles.form_container}>
                <input 
                    type="text" 
                    name="username" 
                    placeholder="Enter Username"
                />
                <input 
                    type="password" 
                    name="password" 
                    placeholder="Enter Password"
                />
                {displayError && <p className={styles.error_message}>{displayError}</p>}
                <input type="submit" value="Login"/>
            </form>
        </div>
    )
}

export default Login