import styles from "./Profile.module.css"
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";

const Profile = () => {
	let [profile, setProfile] = useState(null);
	let {authTokens, logoutUser} = useContext(AuthContext);
	const navigate = useNavigate();

	const handleReturn = () => {
		navigate("/home");
	}

	useEffect(() => {
		getPlayerProfile()
	}, [])

	let getPlayerProfile = async () => {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				}
			})

			let data = await response.json()

			if (response.status === 200) {
				setProfile(data)
			} else if (response.status === 401) {
				logoutUser()
			}
		} catch (error) {
			console.error('Failed to fetch profile', error)
			logoutUser()
		}
	}

	if (!profile) {
		return <div>Loading...</div>
	}

	return (
		<div className={styles.centered_container}>
			<img
				src="../../assets/logo_profil.png"
				alt="Logo"
				className="logo"
			/>
			<div className={styles.userinfo_container}>
				{profile.profile_picture ? (
					<img
						className={styles.logo}
						src={profile.profile_picture}
						alt="Profile"
					/>
				) : (
					<img
						className={styles.logo}
						src="../../assets/logo_profil.png"
						alt="Default Profile"
					/>
				)}
				<p><strong>Username:</strong> {profile.username}</p>
				<p><strong>First Name:</strong> {profile.first_name}</p>
				<p><strong>Last Name:</strong> {profile.last_name}</p>
				<p><strong>Email:</strong> {profile.email}</p>
				<button>Edit profile</button>
			</div>
			<button onClick={handleReturn}>RETURN</button>
		</div>
	);
}

export default Profile;