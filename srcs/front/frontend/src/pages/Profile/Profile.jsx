import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import ImgFallback from '../../components/ImgFallback.jsx'
import default_pic from '../../assets/images/default_profile_pic.png'
import AuthContext from "../../context/AuthContext.jsx";
import styles from "./Profile.module.css";
import logo from "../../assets/images/logo_profil.png"
import TwoFactorSetup from '../../components/TwoFactorSetup';

const Profile = () => {
	const [profile, setProfile] = useState(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editedProfile, setEditedProfile] = useState({});
	const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
	const { authTokens, logoutUser } = useContext(AuthContext);
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

	const handleEditProfile = () => {
		setEditedProfile({
		first_name: profile.first_name || '',
		last_name: profile.last_name || '',
		email: profile.email || '',
		profile_picture: profile.profile_picture || '',
		two_factor: profile.two_factor || false
		});
		setIsEditing(true);
	}

	const handleSaveProfile = async () => {
		const updatedFields = {};
		Object.entries(editedProfile).forEach(([key, value]) => {
		if (value !== (profile[key] || '')) {
			updatedFields[key] = value;
		}
		});

		if (Object.keys(updatedFields).length > 0) {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile/update/`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + String(authTokens.access)
			},
			body: JSON.stringify(updatedFields)
			})

			let data = await response.json()

			if (response.status === 200) {
			setProfile(data)
			setIsEditing(false)
			} else {
			console.error('Failed to update profile', data)
			}
		} catch (error) {
			console.error('Failed to update profile', error)
		}
		} else {
		setIsEditing(false)
		}
	}

	const handleInputChange = (e) => {
		const { name, type, checked } = e.target;
		
		if (name === 'two_factor') {
		if (checked && !profile.two_factor) {
			setShowTwoFactorSetup(true);
		} else if (!checked && profile.two_factor) {
			setEditedProfile(prev => ({
			...prev,
			two_factor: false
			}));
			setProfile(prev => ({
			...prev,
			two_factor: false
			}));
		}
		} else {
		const newValue = type === 'checkbox' ? checked : e.target.value;
		setEditedProfile(prev => ({
			...prev,
			[name]: newValue
		}));
		}
	}

	const handle2FASuccess = () => {
		setShowTwoFactorSetup(false);
		setEditedProfile(prev => ({
		...prev,
		two_factor: true
		}));
		setProfile(prev => ({
		...prev,
		two_factor: true
		}));
	}

	if (!profile) {
		return <div>Loading...</div>
	}

	return (
		<div className={styles.centered_container}>
			<img
				src={logo}
				alt="Logo"
				className={styles.logo}
			/>
			{!isEditing ? (
				<>
				<div className={styles.info_wrapper}>
					<div className={styles.userinfo_container}>
						<ImgFallback	src={profile.profile_picture}
										alt="Default Profile"
										fallback={default_pic}
						/>
						<p><strong>Username:</strong> {profile.username}</p>
						<p><strong>First Name:</strong> {profile.first_name}</p>
						<p><strong>Last Name:</strong> {profile.last_name}</p>
						<p><strong>Email:</strong> {profile.email}</p>
						<p><strong>Two-Factor Authentication:</strong> {profile.two_factor ? 'Enabled' : 'Disabled'}</p>
						<button onClick={handleEditProfile}>Edit profile</button>
					</div>
					<div className={styles.userinfo_container}>
						<p><strong>Number of games:</strong> {profile.nb_games}</p>
						<p><strong>Wins:</strong> {profile.wins}</p>
						<p><strong>Lost:</strong> {profile.loss}</p>
						<p><strong>Tournament wins:</strong> {profile.tr_wins}</p>
						<p><strong>Number of rebounds per game:</strong> {profile.rb}</p>
					</div>
				</div>
				<button onClick={handleReturn}>RETURN</button>
				</>
			) : (
				<div className={styles.edit_profile_modal}>
					<div className={styles.edit_profile_content}>
						<h2 className={styles.edit_profile_title}>Edit Profile</h2>
						<div className={styles.form_group}>
							<label>First Name</label>
							<input 
								type="text" 
								name="first_name" 
								value={editedProfile.first_name} 
								onChange={handleInputChange} 
								placeholder="Optional"
							/>
						</div>
						<div className={styles.form_group}>
							<label>Last Name</label>
							<input 
								type="text" 
								name="last_name" 
								value={editedProfile.last_name} 
								onChange={handleInputChange} 
								placeholder="Optional"
							/>
						</div>
						<div className={styles.form_group}>
							<label>Email</label>
							<input 
								type="email" 
								name="email" 
								value={editedProfile.email} 
								onChange={handleInputChange} 
								placeholder="Optional"
							/>
						</div>
						<div className={styles.form_group}>
							<label>Profile Picture URL</label>
							<input 
								type="text" 
								name="profile_picture" 
								value={editedProfile.profile_picture} 
								onChange={handleInputChange} 
								placeholder="Optional"
							/>
						</div>
						<div className={styles.form_group}>
							<label>
								<input
								type="checkbox"
								name="two_factor"
								checked={editedProfile.two_factor || profile.two_factor}
								onChange={handleInputChange}
								/>
								Enable Two-Factor Authentication
							</label>
						</div>
						<button className={styles.edit_profile_content} onClick={handleSaveProfile}>
						Save
						</button>
					</div>
				</div>
			)}
			
			{showTwoFactorSetup && (
				<div className={styles.edit_profile_modal}>
				<div className={`${styles.edit_profile_content} ${styles.qr_code_container}`}>
					<button 
					className={styles.edit_profile_content_b}
					onClick={() => {
						setShowTwoFactorSetup(false);
						setEditedProfile(prev => ({
						...prev,
						two_factor: false
						}));
					}}
					>
					&times;
					</button>
					<TwoFactorSetup
					onClose={() => {
						setShowTwoFactorSetup(false);
						setEditedProfile(prev => ({
						...prev,
						two_factor: false
						}));
					}}
					onSuccess={handle2FASuccess}
					authTokens={authTokens}
					noModal={true}
					/>
				</div>
				</div>
			)}
		</div>
	);
}

export default Profile;