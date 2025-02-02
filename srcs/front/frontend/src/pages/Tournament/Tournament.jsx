import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";
import { getTournamentInfo } from '../../components/requestList.jsx';
import NameForm from './Modules/NameForm/NameForm.jsx';
import PlayersList from './Modules/PlayersList/PlayersList.jsx';
import styles from './Tournament.module.css';

function Tournament() {

	const	{ authTokens } = useContext(AuthContext);
	const	{ tourId } = useParams(); // Extract tourId from URL
	const	wsRef = useRef(null);
	const	logged = useRef(false);
	const	gameStarted = useRef(false);
	const	[nameError, setNameError] = useState(false);
	const	[info, setInfo] = useState(null);
	const	[players, setPlayers] = useState(null);
	const	navigate = useNavigate();


	useEffect(() => {
		// Getting the room's gamerules (point limit, add bonuses, max time, etc...) for display
		const fetchTournamentInfo = async () => {
			const roomData = await getTournamentInfo(authTokens, tourId);
			return (roomData);
		}
		fetchTournamentInfo()
			.then((data) => {setInfo(data);})
			.catch((err) => console.error("Failed to fetch tournament info:", err));
	}, []);

	// Setting the tab's title on mount, retrieving room's specific info, getting user info, starting websocket connexion
	useEffect(() => {

		document.title = "Connecting";
		// Starting the connexion to the tournament's channel layer
		if (!wsRef.current) {
			const ws = new WebSocket(`wss://${import.meta.env.VITE_IP}:9443/ws/tournament/?tourId=${tourId}&token=${authTokens.access}`);
			wsRef.current = ws;
		}
		
		wsRef.current.onopen = () => {
			document.title = "Enter Name";
			console.log("WebSocket connected");
		};
		
		// Parsing received updates from the room
		wsRef.current.onmessage = (event) => {
			const msg = JSON.parse(event.data);
			console.log(msg);
			// Received updated player's object array (id, arena_name, img)
			if (msg.case == "players_info")
				setPlayers(msg.data);
			// Entered name was confirmed
			else if (msg.case == "set_name_ok") {
				logged.current = true;
				document.title = "Waiting...";
			}
			// Entered name was invalid
			else if (msg.case == "set_name_error")
				setNameError(msg.data);
			
		};

		// Returning to the lobby if the tournament has ended, player lost connexion or couldn't connect
		wsRef.current.onclose = () => {
			navigate("/tournament");
		};

	}, []);

	return (
		<div className={styles.centered_container}>
			{gameStarted.current == false ?
				logged.current ? <PlayersList players={players} info={info}/> : <NameForm wsRef={wsRef} nameError={nameError}/>
			:
				<p>hello</p>
			}
		</div>
	);
}

export default Tournament