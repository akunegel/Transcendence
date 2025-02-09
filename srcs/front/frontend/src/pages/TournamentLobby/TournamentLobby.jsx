import React, { useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import TournamentForm from '../../components/TournamentForm/TournamentForm.jsx';
import logo from "../../assets/images/logo_tournament.png"
import logo2 from "../../assets/images/logo_tournament2.png"
import styles from "./Tournament.module.css"

function TournamentLobby() {
	const navigate = useNavigate();

	useEffect(() => {
		document.title = "Tournament";
	}, []);

	const handleReturn = () => {
		navigate("/lobby");
	}

	return (
		<div>
			<div className={styles.logo_container}>
				<img src={logo}/>
			</div>

			<div className={styles.main_container}>
				<img src={logo2}/>
				<TournamentForm/>
				<div className={styles.centered_container}>
					<button onClick={() => handleReturn()}>RETURN</button>
					<br/>
				</div>
			</div>

		</div>
	);

}

export default TournamentLobby