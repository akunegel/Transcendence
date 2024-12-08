import styles from "./Profil.module.css"
import logo from "../../assets/images/logo_profil.png"
import React, { useState, useEffect } from 'react';
import {useNavigate} from "react-router-dom";
import api from '../../api';

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
				const response = await api.get('/user/profile/');
				setUserInfo(response.data);
			} catch (error) {
				console.error("Error fetching profile:", error);
				localStorage.clear();
				navigate("/login");
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
				alt="Logo"
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