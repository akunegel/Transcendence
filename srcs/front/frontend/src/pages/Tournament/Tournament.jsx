import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getTournamentInfo } from '../../components/requestList.jsx';
import AuthContext from "../../context/AuthContext.jsx";
import NameForm from './Modules/NameForm/NameForm.jsx';
import PlayersList from './Modules/PlayersList/PlayersList.jsx';
import GraphDisplay from './Modules/GraphDisplay/GraphDisplay.jsx';
import PongMatch from './Modules/PongMatch/PongMatch.jsx';
import styles from './Tournament.module.css';


function Tournament() {

	const	{ authTokens } = useContext(AuthContext);
	const	{ tourId } = useParams(); // Extract tourId from URL
	const	wsRef = useRef(null);
	const	[logged, setLogged] = useState(false);
	const	[isLeader, setIsLeader] = useState(false);
	const	[gameStarted, setGameStarted] = useState(false);
	const	[isInMatch, setIsInMatch] = useState(false);
	const	[matchLink, setMatchLink] = useState(false);
	const	[nameError, setNameError] = useState(false);
	const	[info, setInfo] = useState(null);
	const	[players, setPlayers] = useState(null);
	const	navigate = useNavigate();


	const location = useLocation();

	useEffect(() => {
		return () => {
			// Close WebSocket when the component unmounts or the URL changes
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [location.pathname]); // Runs when the URL path changes


	useEffect(() => {
		// Getting the room's gamerules (point limit, add bonuses, max time, etc...) for display
		const fetchTournamentInfo = async () => {
			const roomData = await getTournamentInfo(authTokens, tourId);
			return (roomData);
		}
		fetchTournamentInfo()
			.then((data) => {setInfo(data);})
			.catch();
	}, []);

	// Setting the tab's title on mount, retrieving room's specific info, getting user info, starting websocket connexion
	useEffect(() => {

		document.title = "Connecting...";
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

			switch (msg.case) {
				case 'players_info': // Received updated player's object array (id, arena_name, img)
					setPlayers(msg.data);
					return ;
				case 'set_name_ok': // Entered name was confirmed
					setLogged(true);
					document.title = "Waiting...";
					return ;
				case 'set_name_error': // Entered name was invalid
					setNameError(msg.data);
					return ;
				case 'you_are_leader': // User is designated as tournament's leader
					setIsLeader(true);
					return ;
				case 'tournament_started': // The tournament started
					setGameStarted(true);
					document.title = "Tournament Started !";
					return ;
				case 'go_to_graph': // Players return to the graph
					setIsInMatch(false);
					document.title = "Get ready...";
				case 'start_new_round': // Players go play their next round
					setMatchLink(msg.data.room_id);
					setIsInMatch(true);
					document.title = "Pong !";
				default:
					return ;
			}
		};

		// Returning to the lobby if the tournament has ended, player lost connexion or couldn't connect
		wsRef.current.onclose = () => {
			navigate("/tournament");
		};

		return () => {
			// Closing websocket on unmount
			if (wsRef.current)
				wsRef.current.close();
		};
	}, []);

	return (
		<div className={styles.centered_container}>
			{gameStarted == false ?
				logged ? <PlayersList isLeader={isLeader} wsRef={wsRef} players={players} info={info}/> : <NameForm wsRef={wsRef} nameError={nameError}/>
			:
				isInMatch == false ? <GraphDisplay players={players} info={info}/> : <PongMatch players={players} info={info} link={matchLink}/>
			}
		</div>
	);
}

export default Tournament