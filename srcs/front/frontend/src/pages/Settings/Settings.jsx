import styles from "./Settings.module.css"
import React, { useState, useEffect, useContext } from 'react';
import {useNavigate} from "react-router-dom";
import logo from "../../assets/images/logo_shadowed.png";
import sublogo from "../../assets/images/logo_under.png";
import AuthContext from "../../context/AuthContext.jsx";
import { useTranslation } from 'react-i18next'
// import Select from 'react-select';

function Settings() {
	const navigate = useNavigate();
	const [userLanguage, setLanguage] = useState("");
	let {authTokens, logoutUser} = useContext(AuthContext);
	const { t, i18n } = useTranslation();
	const languageMap = {
		English: 'en',
		Français: 'fr',
		Español: 'es',
	};

	useEffect(() => {
		getPlayerLanguage();
	}, [])

	const getPlayerLanguage = async () => {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/settings/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				}
			})

			let data = await response.json()

			if (response.status === 200) {
				setLanguage(data.language)
			} else if (response.status === 401) {
				logoutUser()
			}
		} catch (error) {
			console.error('Failed to fetch language', error)
			logoutUser()
		}
	}

	const requestLanguageChange = async (language) => {

		if (userLanguage == language)
			return;

		try {
			setLanguage(language);
			i18n.changeLanguage(languageMap[language]); // Set language globally in i18next

			await fetch(`${import.meta.env.VITE_API_URL}/users/language/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + String(authTokens.access),
				},
				body: JSON.stringify({ language }),
			});
		} catch (error) {
			console.error('Failed to update language preference:', error);
		}
	};


	function handleLanguageChange(event){
		setLanguage(event.target.value);
		requestLanguageChange(event.target.value)
			.then(() => {window.location.reload()});
	}

	const handleReturn = () => {
		navigate("/home");
	}

	let deleteAccount = async () => {
		try {
		  let response = await fetch(`${import.meta.env.VITE_API_URL}/users/delete-account/`, {
			method: 'DELETE',
			headers: {
			  'Content-Type': 'application/json',
			  'Authorization': 'Bearer ' + String(authTokens.access)
			}
		  });
		  
		  if (response.ok) {
			logoutUser();
		  } else {
			logoutUser();
		  }
		} catch (error) {
		  logoutUser();
		}
	  }

	return (
		<>
			<div className={styles.centered_container}>
				<img className={styles.up_logo} src={logo} alt="TRANSCENDENCE"/>
				<br/>
				<img className={styles.sub_logo} src={sublogo}/>
			</div>
			<div className={styles.userinfo_container}>
				<p>{t("Change language")} : {userLanguage}</p>
				<div className={styles.centered_container}>
					<select value={userLanguage} onChange={handleLanguageChange}>
						<option value="English">English</option>
						<option value="Français">Français</option>
						<option value="Español">Español</option>
					</select>
					<button onClick={deleteAccount}>DELETE ACCOUNT</button>
				</div>
			</div>

			<div className={styles.centered_container}>
				<button onClick={handleReturn}>{t("RETURN")}</button>
			</div>
		</>
	);
}

export default Settings;