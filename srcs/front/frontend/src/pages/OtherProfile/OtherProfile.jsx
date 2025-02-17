import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import ImgFallback from '../../components/ImgFallback.jsx'
import default_pic from '../../assets/images/default_profile_pic.png'
import AuthContext from "../../context/AuthContext.jsx";
import styles from "../Profile/Profile.module.css";
import logo from "../../assets/images/logo_profil.png";
import { useTranslation } from "react-i18next";

const OtherProfile = () => {
	const [profile, setProfile] = useState(null);
	const { username } = useParams();
	const { authTokens } = useContext(AuthContext);
	const navigate = useNavigate();
	const { t } = useTranslation();


	const handleReturn = () => {
		navigate(-1);
	};

	useEffect(() => {
		getPlayerProfile();
	}, [username]);

	const getPlayerProfile = async () => {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/other-profile/${username}/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				}
			});

			let data = await response.json();

			if (response.status === 200) {
				setProfile(data);
			} else {
				navigate("/*")
				console.error('Failed to fetch profile');
			}
		} catch (error) {
			console.error('Failed to fetch profile', error);
		}
	};

	if (!profile) {
		return <div>Loading...</div>;
	}

	return (
		<div className={styles.centered_container}>
			<img
				src={logo}
				alt="Logo"
				className={styles.logo}
			/>
			<div className={styles.info_wrapper}>
				<div className={styles.userinfo_container}>
					<ImgFallback	src={profile.profile_picture}
									alt="Profile Picture"
									fallback={default_pic}
					/>
					<p><strong>{t("Username")}:</strong> {profile.username}</p>
					<p><strong>{t("First Name")}:</strong> {profile.first_name}</p>
					<p><strong>{t("Last Name")}:</strong> {profile.last_name}</p>
					<p><strong>{t("Email")}:</strong> {profile.email}</p>
				</div>
				<div className={styles.userinfo_container}>
					<p><strong>{t("Number of games")}:</strong> {profile.nb_games}</p>
					<p><strong>{t("Wins")}:</strong> {profile.wins}</p>
					<p><strong>{t("Lost")}:</strong> {profile.loss}</p>
					<p><strong>{t("Tournament wins")}:</strong> {profile.tr_wins}</p>
					<p><strong>{t("Average rebounds per game")}:</strong> {profile.nb_games > 0 ? profile.rb / profile.nb_games : 0}</p>
				</div>
			</div>
			<button onClick={handleReturn}>{t("RETURN")}</button>
		</div>
	);
};

export default OtherProfile;