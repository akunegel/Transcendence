import styles from "./Profil.module.css"
import logo from "../../assets/logo_profil.png"
import React, { useState, useEffect } from 'react';
import {useNavigate} from "react-router-dom";

function Profil() {
	const navigate = useNavigate();
	const [userInfo, setUserInfo] = useState({
		username: '',
		fname: '',
		lname: '',
		email: ''
	});

	useEffect(() => {
		const fetchUserProfile = async () => {
			try {
				const response = await fetch(`http://${import.meta.env.VITE_IP}:8000/user/profile/`,  {
					headers: {
						'Authorization': `Bearer ${localStorage.getItem('access')}`						}
				});

				const responseText = await response.text();
				console.log('Raw response:', responseText);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = JSON.parse(responseText);
				setUserInfo(data);
			} catch (error) {
				console.error("Error fetching profile:", error);
			}
		};

		fetchUserProfile();
	}, []);

	const handleReturn = () => {
		navigate("/home");
	}

	return (
		<div className={styles.centered_container}>
			<img
				src="../../assets/logo_profil.png"
				alt="Logo officiel"
				className="logo"
			/>
			<div className={styles.userinfo_container}>
				<img
					className={styles.logo}
					src="/api/placeholder/150/150"
					alt="Photo de profil"
				/>
				<p><strong>Username:</strong> {userInfo.username}</p>
				<p><strong>First Name:</strong> {userInfo.fname}</p>
				<p><strong>Last Name:</strong> {userInfo.lname}</p>
				<p><strong>Email:</strong> {userInfo.email}</p>
				<p><strong>Password:</strong> ********</p>
				<button>Edit profile</button>
			</div>
			<button onClick={handleReturn}>RETURN</button>
		</div>
	);
}

export default Profil;