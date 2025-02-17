import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getTournamentInfo } from '../../components/requestList.jsx';
import AuthContext from "../../context/AuthContext.jsx";
import NameForm from './Modules/NameForm/NameForm.jsx';
import PlayersList from './Modules/PlayersList/PlayersList.jsx';
import GraphDisplay from './Modules/GraphDisplay/GraphDisplay.jsx';
import PongMatch from './Modules/PongMatch/PongMatch.jsx';
import styles from './Tournament.module.css';
import { useTranslation } from "react-i18next";


function Tournament() {
	
	const	{ t } = useTranslation();
	const	{ authTokens } = useContext(AuthContext);
	const	{ tourId } = useParams(); // Extract tourId from URL
	const	wsRef = useRef(null);
	const	[info, setInfo] = useState(null);
	const	[nameError, setNameError] = useState(false);
	const	[logged, setLogged] = useState(false);
	const	[players, setPlayers] = useState(null);
	const	[isLeader, setIsLeader] = useState(false);
	const	[gameStarted, setGameStarted] = useState(false);
	const	[isInMatch, setIsInMatch] = useState(false);
	const	[matchOpponents, setMatchOpponents] = useState(false);
	const	[graphTitle, setGraphTitle] = useState("[ Waiting for round to end... ]");
	const	[roundResults, setRoundResults] = useState([]);
	const	navigate = useNavigate();
	const	location = useLocation();


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
			const tourData = await getTournamentInfo(authTokens, tourId);
			return (tourData);
		}
		fetchTournamentInfo()
			.then((data) => {setInfo(data);})
			.catch();
	}, []);

	// Setting the tab's title on mount, retrieving room's specific info, getting user info, starting websocket connexion
	useEffect(() => {

		document.title = t("Connecting...");
		// Starting the connexion to the tournament's channel layer
		if (!wsRef.current) {
			const ws = new WebSocket(`wss://${import.meta.env.VITE_IP}:9443/ws/tournament/?tourId=${tourId}&token=${authTokens.access}`);
			wsRef.current = ws;
		}

		wsRef.current.addEventListener("open", () => {
			// console.log("WebSocket connected!");
		});
	
		wsRef.current.addEventListener("message", (event) => {
			const msg = JSON.parse(event.data);

			switch (msg.case) {
				case 'players_info': // Received updated player's object array (id, arena_name, img)
					setPlayers(msg.data); // Ensure new reference
					return ;
				case 'set_name_ok': // Entered name was confirmed
					setLogged(true);
					document.title = t("Waiting...");
					return ;
				case 'set_name_error': // Entered name was invalid
					setNameError(msg.data);
					return ;
				case 'you_are_leader': // User is designated as tournament's leader
					setIsLeader(true);
					return ;
				case 'tournament_started': // The tournament started
					setGameStarted(true);
					document.title = t("Get ready...");
					return ;
				case 'go_to_graph': // Players return to the graph
					setIsInMatch(false);
					setGraphTitle(t("[ Waiting for round to end... ]"))
					document.title = t("Waiting...");
					return ;
				case 'round_starting': // The next round is starting in 10sec
					setGraphTitle("[ " + t("Round") + " " + msg.data + " " + t("is about to start...") + " ]")
					return ;
				case 'match_start': // Players go play their next round
					setMatchOpponents(msg.data);
					setIsInMatch(true);
					document.title = "Pong !";
					return ;
				case 'round_results':
					setRoundResults(msg.data);
					return ;
				case 'tournament_ended':
					setGraphTitle(t(msg.data));
					return ;
				default:
					return ;
			}
		});

		// Returning to the lobby if the tournament has ended, player lost connexion or couldn't connect
		wsRef.current.onclose = () => {
			navigate("/tournament");
		};

		return () => {
			if (wsRef.current) // Closing websocket on unmount
			wsRef.current.close();
		};
	}, []);

	return (
		<div className={styles.centered_container}>
			{gameStarted == false ?
				logged ?
					<PlayersList isLeader={isLeader} wsRef={wsRef} players={players} info={info}/>
				:
					<NameForm wsRef={wsRef} nameError={nameError}/>
			:
				isInMatch ?
					<PongMatch players={players} info={info} opponents={matchOpponents} wsRef={wsRef}/>
				:
					<GraphDisplay players={players} info={info} results={roundResults} title={graphTitle}/>
			}
		</div>
	);
}

export default Tournament