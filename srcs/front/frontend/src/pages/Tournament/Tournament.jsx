import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";
import styles from './Tournament.module.css';

function Tournament() {

	const	{ tourId } = useParams(); // Extract tourId from URL
	const	{ authTokens } = useContext(AuthContext);
	const	navigate = useNavigate();
	
	const	wsRef = useRef(null);
	const	[players, setPlayers] = useState(null);
	const	playersRef = useRef(null);
	const	[info, setInfo] = useState(null);
	const	infoRef = useRef(null);


	useEffect(() => {
		// Getting the room's gamerules (point limit, add bonuses, max time, etc...) for display
		const fetchTournamentInfo = async () => {
			const roomData = await getTournamentInfo(authTokens, tourId);
			return (roomData);
		}
		fetchTournamentInfo()
			.then((data) => {infoRef.current = data;
							setInfo(data);})
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
			document.title = "Waiting";
			console.log("WebSocket connected");
		};
		
		// Parsing received updates from the room
		wsRef.current.onmessage = (event) => {
			const data = JSON.parse(event.data);

		};

		// Returning to the lobby if the tournament has ended, player lost connexion or couldn't connect
		wsRef.current.onclose = () => {
			navigate("/tournament");
		};


	}, []);

	return (
		<div className={styles.centered_container}>
			<p>hello</p>
		</div>
	);
}

export default Tournament