// AuthContext.jsx
import { createContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export default AuthContext;

export const AuthProvider = ({ children }) => {
	let [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null)
	let [user, setUser] = useState(() => localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) : null)
	let [loading, setLoading] = useState(true)

	const navigate = useNavigate();

	let logoutUser = () => {
		setAuthTokens(null)
		setUser(null)
		setLoading(false)
		localStorage.removeItem('authTokens')
		navigate('/login')
	}

	
	let updateToken = async () => {
		if (!authTokens) return;
		
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/token/refresh/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({'refresh':authTokens.refresh})
			})
			let data = await response.json();
			
			if (response.status === 200) {
				setAuthTokens(data);
				setUser(jwtDecode(data.access))
				localStorage.setItem('authTokens', JSON.stringify(data))
			} else {
				logoutUser()
			}
		} catch (error) {
			console.error("Token refresh failed", error);
			logoutUser();
		}
	}
	
	let loginWith42 = async (code) => {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/auth/42-login/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ code })
			});
			
			let data = await response.json();
			
			if (response.status === 200) {
				setAuthTokens(data);
				setUser(jwtDecode(data.access));
				localStorage.setItem('authTokens', JSON.stringify(data));
				navigate('/');
			} else {
				console.error("Failed to log in with 42:", data.error);
				navigate('/login');
			}
		} catch (error) {
			console.error("Error during 42 login:", error);
			navigate('/login');
		}
	};
	
	useEffect(() => {
		if (authTokens) {
			updateToken();
		}
		setLoading(false);
	}, [])
	
	useEffect(() => {
		let counter = 1000 * 60 * 15
		let interval = setInterval(() => {
			if (authTokens) {
				updateToken()
			}
		}, counter)
		return () => clearInterval(interval)
	}, [authTokens])
	
	let contextData = {
		user: user,
		authTokens: authTokens,
		setAuthTokens: setAuthTokens,
		setUser: setUser,
		logoutUser: logoutUser,
		loginWith42: loginWith42
	}
	
	return(
		<AuthContext.Provider value={contextData}>
			{loading ? null : children}
		</AuthContext.Provider>
	);
}