import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";
import { getUser, getRoomInfo } from '../../components/GettersList.jsx';
import styles from './OnlinePong.module.css';


function OnlinePong() {

	const	{ roomId } = useParams(); // Extract roomId from URL
	const	{ authTokens, logoutUser } = useContext(AuthContext);
	const	[user, setUser] = useState({});
	
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
	const	LPaddle = useRef({ x: 50, y: 250});
	const	RPaddle = useRef({ x: 750, y: 250});
	const	pos = useRef({ x: 400, y: 250 });
	const	obj = useRef({ x: 400, y: 250 });
	const	[score, setScore] = useState({left: 0, right: 0});
	const	[rules, setRules] = useState(null);
	const	rulesRef = useRef(null);
	
	
	const navigate = useNavigate();

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

	// Setting the tab's title on mount, retrieving room's specific info, getting user info
	useEffect(() => {

		document.title = "Pong";
		const fetchRoomInfo = async () => {
			const roomData = await getRoomInfo(authTokens, roomId);
			return (roomData);
		}

		const fetchUserInfo = async () => {
			const userData = await getUser(authTokens);
			if (userData == null)
				logoutUser();
			console.log(userData);
			return (userData);
		}

		fetchRoomInfo()
			.then((data) => {setRules(data);
							rulesRef.current = data;
							setStatusTitle("- First to " + data.max_point + " wins -");
							setTimer({min: data.max_time, sec: 0});
						})
			.catch((err) => console.error("Failed to fetch room info:", err));
		fetchUserInfo()
			.then((data) => setUser(data))
			.catch((err) => console.error("Failed to user info:", err));
	}, []);

	const displayGameStartTimer = async () => {
		for(let i = 3; i != 0; i--){
			setStatusTitle("- Game starting in " + i + " -");
			await sleep(1000);
		}
	}

	useEffect(() => {

		// Starting the connexion to the room's channel layer
		if (!wsRef.current) {
			const ws = new WebSocket(`wss://${import.meta.env.VITE_IP}:9443/ws/room/${roomId}/`);
			wsRef.current = ws;
		}
		
		wsRef.current.onopen = () => {
			console.log("WebSocket connected");
		};
		
		// Parsing received game status updates from the room
		wsRef.current.onmessage = (event) => {
			const data = JSON.parse(event.data);
			gameStarted.current = data.state.game_started;

			console.log(data.case);

			// Game is about to start (3 seconds from now)
			if (data.case == "start_game") {
				displayGameStartTimer()
					.then(() =>{timerIsRunning.current = true;
								setStatusTitle("- First to " + rulesRef.current.max_point + " wins -");
								startTime.current = new Date();
					});
				}

			// Receiving the next position of the ball
			if (data.case == "ball_update" || data.case == "global_update") {
				messageTime.current = new Date();
				pos.current.x = obj.current.x;
				pos.current.y = obj.current.y;
				obj.current.x = data.state.objx;
				obj.current.y = data.state.objy;
				timeBeforeHit.current = data.state.time;
				setScore({left: data.state.l_score, right: data.state.r_score});
			}
			// Receiving the paddles' new position
			if (data.case == "paddle_update" || data.case == "global_update") {
				LPaddle.current.y = data.state.l_paddle;
				RPaddle.current.y = data.state.r_paddle;
			}
			// Receiving the winner of the game and stopping the animation display
			if (data.case == "end_game") {
				LPaddle.current.y, RPaddle.current.y = 250;
				timeBeforeHit.current = 0
				if (data.state.winner == "draw")
					setStatusTitle("- Game Ended In A Draw ! -");
				else
					setStatusTitle("- " + data.state.winner + " is the winner -");
				timerIsRunning.current = false;
				drawGame(canvasRef.current.getContext('2d'), 400, 250);
			}
		};

		// Returning to the lobby if the game has ended, player lost connexion or couldn't connect
		wsRef.current.onclose = () => {
			console.log("WebSocket disconnected");
			navigate("/lobby");
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

	const drawBall = (ctx, x, y) => {
		// Drawing the ball at the given position
		ctx.beginPath();
		ctx.arc(x, y, 10, 0, 2 * Math.PI);
		ctx.fillStyle = 'white';
		ctx.fill();
	};

	const drawPaddle = (ctx, x, y) => {
		// Drawing a paddle centered at the given position
		ctx.beginPath();
		ctx.rect(x, y - 60, 10, 120);
		ctx.fillStyle = 'white';
		ctx.fill();
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
		drawPaddle(ctx, LPaddle.current.x - 10, LPaddle.current.y);
		drawPaddle(ctx, RPaddle.current.x, RPaddle.current.y);
		drawBall(ctx, ball_x, ball_y);
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

			<div className={styles.centered_container} style={{marginTop:"80px"}}>

			{rules && rules.has_time_limit == true ?
					<h2 className="m-0" style={{borderTop: "5px solid white", color: timerColor}}>{timer.min > 9 ? "" : "0"}{timer.min}:{timer.sec > 9 ? "" : "0"}{timer.sec}</h2>
				:
					<h2 className="m-0" style={{borderTop: "5px solid white"}}> {score.left > 9 ? "" : "0"}{score.left}:{score.right > 9 ? "" : "0"}{score.right} </h2>
				}
				<p className="m-0" style={{borderTop: "5px solid white"}}>{statusTitle}</p>
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

			<div className={styles.centered_container} style={{borderBottom: "5px solid white"}}>
				<p className="m-0">Room is: {rules != null && rules.is_private == true ? "Private" : "Public"}</p>
			</div>

		</div>
	);
}

export default OnlinePong;
