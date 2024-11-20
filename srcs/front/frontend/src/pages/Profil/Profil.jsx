import styles from "./Profil.module.css"
import api from "../../api";
import logo from "../../assets/logo_profil.png"
import { useState, useEffect } from "react";
import {useNavigate, useLocation} from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import ProfileTest from '../../assets/images.png'

function Profil() {
	const navigate = useNavigate();
	const userToken = localStorage.getItem(ACCESS_TOKEN);

	const handleReturn = () => {
		navigate("/home");
	}

	return (
		<div className={styles.centered_container}>
			<img className={styles.logo} src={logo} alt="Logo officiel" />
			<div className={styles.userinfo_container}>
				<img src={ProfileTest} alt="Photo de profil" />
				<p className="identity_field"><strong>Nom :</strong> John Doe</p>
				<p className="identity_field"><strong>Prénom :</strong> Jane</p>
				<button>Edit profile</button>
			</div>
			<button onClick={() => handleReturn()}>RETURN</button>
		</div>

	);
}

export default Profil