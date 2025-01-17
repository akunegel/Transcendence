import { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';
import styles from "./Login.module.css";
import logo from "../../assets/images/logo_login.png"

const Login = () => {
    const { setAuthTokens, setUser } = useContext(AuthContext);
    const [displayError, setDisplayError] = useState("");
    const [requires2FA, setRequires2FA] = useState(false);
    const [tempCredentials, setTempCredentials] = useState(null);
    const [verificationCode, setVerificationCode] = useState("");
    const navigate = useNavigate();

    const loginUser = async (e) => {
        e.preventDefault();
        setDisplayError("");

        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}users/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.status === 200) {
                if (data.requires_2fa) {
                    setRequires2FA(true);
                    setTempCredentials({ username, password });
                } else {
                    setAuthTokens(data);
                    setUser(jwtDecode(data.access));
                    localStorage.setItem('authTokens', JSON.stringify(data));
                    navigate('/');
                }
            } else {
                setDisplayError(data.detail || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            setDisplayError("An error occurred. Please try again.");
            console.error("Login error:", error);
        }
    }

    const verify2FA = async (e) => {
        e.preventDefault();
        setDisplayError("");

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}users/2fa/verify/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: tempCredentials.username,
                    password: tempCredentials.password,
                    verification_code: verificationCode
                })
            });

            const data = await response.json();

            if (response.status === 200) {
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                localStorage.setItem('authTokens', JSON.stringify(data));
                navigate('/');
            } else {
                setDisplayError(data.detail || "Invalid verification code");
            }
        } catch (error) {
            setDisplayError("An error occurred. Please try again.");
            console.error("2FA verification error:", error);
        }
    }

    return (
        <div className={styles.center_container}>
            <img className={styles.login_image} src={logo} alt="Login logo"/>
            {!requires2FA ? (
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
            ) : (
                <form onSubmit={verify2FA} className={styles.form_container}>
                    <input 
                        type="text" 
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                    />
                    {displayError && <p className={styles.error_message}>{displayError}</p>}
                    <input type="submit" value="Verify"/>
                    <button 
                        onClick={() => {
                            setRequires2FA(false);
                            setTempCredentials(null);
                            setVerificationCode("");
                        }}
                        className={styles.back_button}
                    >
                        Back to Login
                    </button>
                </form>
            )}
        </div>
    )
}

export default Login;
