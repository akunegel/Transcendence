import React, { useState, useContext } from 'react'
import AuthContext from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom"
import CustomGameForm from "../../components/CustomGameForm/CustomGameForm.jsx"
import logo from "../../assets/images/logo_lobby.png"
import styles from "./Lobby.module.css"


function Lobby(){
	const navigate = useNavigate();
	const { authTokens } = useContext(AuthContext);
	const [openCustom, setOpenCustom] = useState(false);
	const [noRoomFound, setNoRoomFound] = useState(false);

	const handleQuick = async (f) => {
		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/quickJoinGame/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				}
			})

			const data = await res.json();
			const room_id = data.room_id;

			if (res.ok) {
				if (room_id == "None")
					// No free room was found
					setNoRoomFound(true);
				else // Connecting to the room
					navigate(`/play/${room_id}/`);
			}
			else
				console.error(JSON.stringify(data));
		}
		catch (error) {
			console.error('Quick join error:', error)
		}
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