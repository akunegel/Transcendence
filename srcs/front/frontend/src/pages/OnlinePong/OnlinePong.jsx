import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";
import ImgFallback from '../../components/ImgFallback.jsx';
import default_pic from '../../assets/images/default_profile_pic.png'
import disconnected from '../../assets/images/connexion_lost.png'
import { getRoomInfo } from '../../components/requestList.jsx';
import { drawBonus } from '../Pong/BonusManager.js';
import styles from './OnlinePong.module.css';
import { useTranslation } from "react-i18next";


function OnlinePong() {
	
	const	{ t } = useTranslation();
	const	{ roomId } = useParams(); // Extract roomId from URL
	const	{ authTokens } = useContext(AuthContext);
	
	const	canvasRef = useRef(null);
	const	lastUpdateTimeRef = useRef(0);
	const	wsRef = useRef(null);
	const	[statusTitle, setStatusTitle] = useState("");
	const	startTime = useRef(null);
	const	[timer, setTimer] = useState({min: 0, sec: 0});
	const	timerIsRunning = useRef(false);
	const	[timerColor, setTimerColor] = useState("white");

	const	gameStarted = useRef(false);
	const	messageTime = useRef(0);
	const	timeBeforeHit = useRef(0);
	const	LPaddle = useRef({ x: 50, y: 250, size: 120});
	const	RPaddle = useRef({ x: 750, y: 250, size: 120});
	const	pos = useRef({ x: 400, y: 250 });
	const	obj = useRef({ x: 400, y: 250 });
	const	availableBonus = useRef("none");
	const	[score, setScore] = useState({left: 0, right: 0});
	const	[rules, setRules] = useState(null);
	const	[p1, setP1] = useState(null);
	const	[p2, setP2] = useState(null);
	const	rulesRef = useRef(null);
	
	const navigate = useNavigate();
	const location = useLocation();
	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
	
	useEffect(() => {
		return () => {
			// Close WebSocket when the component unmounts or the URL changes
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [location.pathname]); // Runs when the URL path changes

	const handleReturn = () => {
		navigate("/lobby");
	}


	// Timer mechanic for maxTime
	useEffect(() => {
		let inter;
		if (timerIsRunning.current) {
			inter = setInterval(() => {
				setTimer((prevTime) => {
					let secSinceStart = Math.floor((new Date() - startTime.current) / 1000);
					let { min, sec } = prevTime;

					min = (rulesRef.current.max_time) - Math.floor(secSinceStart / 60);
					sec = 60 - (secSinceStart % 60);
					if (sec == 60)
						sec = 0;
					else
						min -= 1;
					if (min <= 0 && sec <= 0) {
						setTimerColor(() => {return "darkred"});
						timerIsRunning.current = false;
					}
					return { min, sec };
				});
			}, 1000);
		}
		return () => clearInterval(inter); // Cleanup on unmount or when isRunning changes
		}, [timerIsRunning.current]);


	const displayGameStartTimer = async () => {
		for(let i = 3; i != 0; i--){
			setStatusTitle("- " + t("Game starting in") + " " + i + " -");
			document.title = i;
			await sleep(1000);
		}
		document.title = "Pong";
	}


	// Setting the tab's title on mount, retrieving room's specific info, getting user info, starting websocket connexion
	useEffect(() => {

		document.title = t("Waiting");

		// Getting the room's gamerules (point limit, add bonuses, max time, etc...) for display
		const fetchRoomInfo = async () => {
			const roomData = await getRoomInfo(authTokens, roomId);
			return (roomData);
		}
		fetchRoomInfo()
			.then((data) => {rulesRef.current = data;
							setRules(data);
							setStatusTitle("- " + t("First to") + " " + data.max_point + " "+ t("wins") + " -");
							setTimer({min: data.max_time, sec: 0});})
			.catch(() => {});

		// Starting the connexion to the room's channel layer
		if (!wsRef.current) {
			const ws = new WebSocket(`wss://${import.meta.env.VITE_IP}:9443/ws/room/?roomId=${roomId}&token=${authTokens.access}`);
			wsRef.current = ws;
		}
		
		wsRef.current.onopen = () => {
			// console.log("WebSocket connected");
		};
		
		// Parsing received game status updates from the room
		wsRef.current.onmessage = (event) => {
			const msg = JSON.parse(event.data);

			switch (msg.case) {

				case 'players_info':
					setP1(msg.data[0])
					if (msg.data.length > 1)
						setP2(msg.data[1])
					break ;
				case 'begin_countdown':
					// Game is about to start (3 seconds from now)
					displayGameStartTimer()
					.then(() =>{timerIsRunning.current = true;
						startTime.current = new Date();
					});
					break ;
				case 'start_game':
					gameStarted.current = true;
					setStatusTitle("- "+ t("First to") + " " + rulesRef.current.max_point + " " + t("wins") + " -");
					break ;
				case 'ball_update':
					// Receiving the next position of the ball
					messageTime.current = new Date();
					pos.current.x = obj.current.x;
					pos.current.y = obj.current.y;
					obj.current.x = msg.data.objx;
					obj.current.y = msg.data.objy;
					LPaddle.current.size = msg.data.l_paddle_size;
					RPaddle.current.size = msg.data.r_paddle_size;
					availableBonus.current = msg.data.available_bonus;
					timeBeforeHit.current = msg.data.time;
					setScore({left: msg.data.l_score, right: msg.data.r_score});
				case 'paddle_update':
					// Receiving the paddles' new position
					LPaddle.current.y = msg.data.l_paddle;
					RPaddle.current.y = msg.data.r_paddle;
					break ;
				case 'end_game':
					// Receiving the winner of the game and stopping the animation display
					gameStarted.current = false;
					LPaddle.current.y, RPaddle.current.y = 250;
					timeBeforeHit.current = 0
					// Displaying winner's username
					if (msg.data.winner == null)
						setStatusTitle("- " + t("Game Ended In A Draw !") + " -");
					else
						setStatusTitle("- " + msg.data.winner + " " + t("is the winner !") + " -");
					timerIsRunning.current = false;
					drawGame(canvasRef.current.getContext('2d'), 400, 250);
					break ;
			}
		};

		// Returning to the lobby if the game has ended, player lost connexion or couldn't connect
		wsRef.current.onclose = () => {
			// console.log("WebSocket disconnected");
			navigate("/lobby");
		};

		return () => {
			// Closing websocket on unmount
			if (wsRef.current)
				wsRef.current.close();
		};
	}, []);


	useEffect(() => {
		
		// Listens for KeyDown event, checking if websocket is still open
		const handleKeyDown = (event) => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				switch (event.key)
				{
					case 'ArrowUp':
						wsRef.current.send(JSON.stringify({ action: "arrow_up_pressed" }));
						break;
					case 'ArrowDown':
						wsRef.current.send(JSON.stringify({ action: "arrow_down_pressed" }));
						break;
				}
			}
		};

		// Listens for KeyUp event, checking if websocket is still open
		const handleKeyUp = (event) => {
			if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
				switch (event.key)
				{
					case 'ArrowUp':
						wsRef.current.send(JSON.stringify({ action: "arrow_up_unpressed" }));
						break;
					case 'ArrowDown':
						wsRef.current.send(JSON.stringify({ action: "arrow_down_unpressed" }));
						break;
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);


	const drawBall = (ctx, x, y, color) => {
		// Drawing the ball at the given position
		ctx.beginPath();
		ctx.arc(x, y, 10, 0, 2 * Math.PI);
		ctx.fillStyle = color;
		ctx.fill();
	};


	const drawPaddle = (ctx, x, y, size) => {
		// Drawing a paddle centered at the given position
		ctx.beginPath();
		ctx.rect(x, y - (size / 2), 10, size);
		ctx.fillStyle = 'white';
		ctx.fill();
	}


	const drawBonusBox = (ctx) => {
		// Drawing a box in the center to hold the current bonus
		ctx.beginPath();
		ctx.rect(375, 225, 50, 50);
		ctx.fillStyle = 'white';
		ctx.fill();
		ctx.clearRect(380, 230, 40, 40);
		// Drawing a visual for the bonus
		if (availableBonus.current != "none")
			drawBonus(availableBonus.current, ctx);
	}


	const drawGame = (ctx, ball_x, ball_y) =>
	{
		// Clearing out last frame
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Drawing center lines for esthetics (looks nice, right ?)
		ctx.beginPath();
		for (let i = 0; i != 500; i += 10)
			ctx.rect(398, i, 4, 1);
		ctx.fillStyle = 'grey';
		ctx.fill();

		// Drawing non-static game elements
		drawPaddle(ctx, LPaddle.current.x - 10, LPaddle.current.y, LPaddle.current.size);
		drawPaddle(ctx, RPaddle.current.x, RPaddle.current.y, RPaddle.current.size);
		if (rulesRef.current && rulesRef.current.add_bonus == true)
			drawBonusBox(ctx);
		drawBall(ctx, ball_x, ball_y, "white");
	}


	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		const animate = (time) =>
		{
			if (gameStarted.current && time - lastUpdateTimeRef.current > 1000 / 61) {
				// Calculating the distance from the current position to the target position
				const dx = obj.current.x - pos.current.x;
				const dy = obj.current.y - pos.current.y;

				
				// What percentage of the 'timeBeforeHit' has passed ?
				const timeSinceLastMessage = (new Date() - messageTime.current) / 1000; // Time since last obj update in seconds
				let timeDifRatio = timeSinceLastMessage / timeBeforeHit.current; // Getting the ratio of time passed until nextHit
				timeDifRatio = Math.min(Math.max(timeDifRatio, 0), 1); // Clamping the ratio between 0 and 1

				// The approximated position of the ball depending on the ratio of time passed since the new objective was set
				const ball_x = pos.current.x + (dx * timeDifRatio);
				const ball_y = pos.current.y + (dy * timeDifRatio);

				drawGame(context, ball_x, ball_y);
				lastUpdateTimeRef.current = time;
			}
			requestAnimationFrame(animate);

		};
		requestAnimationFrame(animate);

		return () => cancelAnimationFrame(animate);
	}, []);

	
	return (
		<div className={styles.centered_container}>

			<div className={styles.top_container}>
				{/* Player1 info */}
				<div className={styles.player_info}>
					{p1 ?
						p1.connected ? 
							<ImgFallback src={p1.img} alt="Profile Picture" fallback={default_pic}/>
						:
							<img src={disconnected} alt="Player Disconnected"/>	
					:
						<img src={default_pic} alt="Waiting for player"/>	
					}
					<p className="m-0" style={{ textAlign: "left"}}>
						{p1 ? p1.username : t("waiting...")}
					</p>
				</div>
				{/* Middle Display - Current score or time left */}
				<div className={styles.centered_container} style={{marginTop:"80px"}}>
					{rules && rules.has_time_limit == true ?
							<h2 className="m-0" style={{borderTop: "5px solid white", color: timerColor}}>{timer.min > 9 ? "" : "0"}{timer.min}:{timer.sec > 9 ? "" : "0"}{timer.sec}</h2>
						:
							<h2 className="m-0" style={{borderTop: "5px solid white"}}> {score.left > 9 ? "" : "0"}{score.left}:{score.right > 9 ? "" : "0"}{score.right} </h2>
						}
				</div>
				{/* Player2 info */}
				<div className={styles.player_info}>
					<p className="m-0" style={{ textAlign: "right"}}>
						{p2 ? p2.username : t("waiting...")}
					</p>
					{p2 ?
						p2.connected ? 
							<ImgFallback src={p2.img} alt="Profile Picture" fallback={default_pic}/>
						:
							<img src={disconnected} alt="Player Disconnected"/>
					:
						<img src={default_pic} alt="Waiting for player"/>
					}
				</div>
			</div>

			<div className={styles.game_container}>

				<div className={styles.points_container} style={{borderLeft: "5px solid white"}}>
					{Array.from({ length: (rules != null ? rules.max_point - score.left : 0)}).map((_, index) =>  (<div className={styles.not_point} key={index}/>))}
					{Array.from({ length: score.left}).map((_, index) => (<div className={styles.a_point} key={index}/>))}
				</div>

				<div className={styles.canvas_container}>
					<canvas ref={canvasRef} width={800} height={500}/>
				</div>

				<div className={styles.points_container} style={{borderRight: "5px solid white"}}>
				{Array.from({ length: (rules != null ? rules.max_point - score.right : 0)}).map((_, index) =>  (<div className={styles.not_point} key={index}/>))}
					{Array.from({ length: score.right}).map((_, index) => (<div className={styles.a_point} key={index}/>))}
				</div>

			</div>

			<div className={gameStarted.current ? styles.status_title_bottom : styles.status_title_center}>
				<p className="m-0">{statusTitle}</p>
			</div>

		</div>
	);
}

export default OnlinePong;
