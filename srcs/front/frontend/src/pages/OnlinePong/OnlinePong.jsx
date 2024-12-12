import { useParams } from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";
import React, { useState, useEffect, useRef, useContext } from 'react';
import styles from './OnlinePong.module.css';
import { useNavigate } from "react-router-dom";


function OnlinePong() {

	const { roomId } = useParams(); // Extract roomId from URL
	const { authTokens } = useContext(AuthContext);
	const canvasRef = useRef(null);
	const timeBeforeHit = useRef(0);
	const messageTime = useRef(0);
	const LPaddle = useRef({ x: 50, y: 250});
	const RPaddle = useRef({ x: 750, y: 250});
	const [score, setScore] = useState({left: 0, right: 0});
	const [rules, setRules] = useState(null);
	const [statusTitle, setStatusTitle] = useState("");
	const gameStarted = useRef(false);
	const pos = useRef({ x: 400, y: 250 });
	const obj = useRef({ x: 400, y: 250 });
	const lastUpdateTimeRef = useRef(0);
	const wsRef = useRef(null);
	
	const navigate = useNavigate();

	const handleReturn = () => {
		navigate("/lobby");
	}

	// Setting the tab's title on mount, retrieving room's specific info
	useEffect(() => {

		document.title = "Pong";
		const fetchRoomInfo = async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/retrieveRoomInfo/${roomId}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + String(authTokens.access)
					}
				})
	
				const data = await res.json();
	
				if (res.ok) {
					return (data);
				}
				else
					console.error(JSON.stringify(data));
			}
			catch (error) {
				console.error('Fetching room info error:', error)
			}
		}
		fetchRoomInfo()
			.then((data) => {setRules(data);
							setStatusTitle("- First to " + data.max_point + " wins -");})
			.catch((err) => console.error("Failed to fetch room info:", err));
	}, []);

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
				setStatusTitle("- " + data.state.winner + " is the winner -");
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
				<h2 style={{borderTop: "5px solid white"}}> {score.left > 9 ? "" : 0}{score.left}:{score.right > 9 ? "" : 0}{score.right} </h2>
				<p style={{borderTop: "5px solid white"}}>{statusTitle}</p>
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
				<p>Room is: {rules != null && rules.is_private == true ? "Private" : "Public"}</p>
			</div>

		</div>
	);
}

export default OnlinePong;
