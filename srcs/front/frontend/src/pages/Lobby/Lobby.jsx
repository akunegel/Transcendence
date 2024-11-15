import React, {useEffect} from 'react'
import {useNavigate, useLocation} from "react-router-dom"
import logo from "../../assets/logo_lobby.png"
import styles from "./Lobby.module.css"


function Lobby(){
	const navigate = useNavigate();

	const handleQuick = () => {
		navigate("/join");
	}

	const handleCustom = () => {

	}

	const handleStats = () => {

	}

	const handleReturn = () => {
		navigate("/home");
	}
	return (
		<div>

			<div className={styles.logo_container}>
				<img src={logo}/>
			</div>

			<div className={styles.main_container}>
				<div className={styles.centered_container}>
					<button onClick={() => handleQuick()}>QUICK JOIN</button>
					<button onClick={() => handleCustom()}>CUSTOM GAME</button>
					<button onClick={() => handleStats()}>STATS</button>
					<button onClick={() => handleReturn()}>RETURN</button>
					<br/>
				</div>
			</div>

		</div>
	);
}

export default Lobby