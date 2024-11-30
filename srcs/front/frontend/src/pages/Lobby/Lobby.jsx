import React, {useEffect, useState} from 'react'
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import {useNavigate} from "react-router-dom"
import CustomGameForm from "../../components/CustomGameForm/CustomGameForm.jsx"
import api from "../../api";
import logo from "../../assets/images/logo_lobby.png"
import styles from "./Lobby.module.css"


function Lobby(){
	const navigate = useNavigate();
	const [openCustom, setOpenCustom] = useState(false);
	const [noRoomFound, setNoRoomFound] = useState(false);

	const handleQuick = async (f) => {
		const res = await api.post("/pong/quickJoinGame/");
		const room_id = res.data.room_id;
		if (room_id == "None")
			setNoRoomFound(true);
		else
			navigate(`/play/${room_id}/`);
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
					{noRoomFound && <p>No room found...</p>}
					<button onClick={() => handleQuick()}>QUICK JOIN</button>
					<button onClick={() => setOpenCustom(openCustom ? false : true)}>CUSTOM GAME</button>
					<button onClick={() => handleStats()}>STATS</button>
					<button onClick={() => handleReturn()}>RETURN</button>
					<br/>
				</div>

				{openCustom && <CustomGameForm/>}
			</div>

		</div>
	);
}

export default Lobby