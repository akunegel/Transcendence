import { useParams } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import styles from './OnlinePong.module.css';
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";


function OnlinePong() {
	
	const canvasRef = useRef(null);
	const keys = useRef({ up: false, down: false});
	const timeBeforeHit = useRef(0);
	const messageTime = useRef(0);
	const LPaddle = useRef({ x: 50, y: 250});
	const RPaddle = useRef({ x: 750, y: 250});
	const [score, setScore] = useState({left: 0, right: 0});
	const [rules, setRules] = useState(null);
	const gameStarted = useRef(false);
	const pos = useRef({ x: 400, y: 250 });
	const obj = useRef({ x: 400, y: 250 });
	const speed = useRef(2);
	const lastUpdateTimeRef = useRef(0);
	const { roomId } = useParams(); // Extract roomId from URL
	const wsRef = useRef(null);
	
	const navigate = useNavigate();

	const handleReturn = () => {
		navigate("/home");
	}
	
	// Setting the tab on mount, retrieving room's info
	useEffect(() => {
		document.title = "Pong";
		const fetchRoomInfo = async () => {
			const res = await api.get(`/pong/retrieveRoomInfo/${roomId}`);
			console.log(res.data);
			return (res.data);
		}
		setRules(fetchRoomInfo());
	}, []);

	useEffect(() => {
		if (!wsRef.current) {
			const ws = new WebSocket(`ws://${import.meta.env.VITE_IP}:8000/ws/room/${roomId}/`);
			wsRef.current = ws;
		}
		
		wsRef.current.onopen = () => {
			console.log("WebSocket connected");
		};
		
		wsRef.current.onmessage = (event) => {
			const data = JSON.parse(event.data);
			gameStarted.current = data.state.game_started;
			console.log("got message:", data.case);
			if (data.case == "ball_update" || data.case == "global_update") {
				messageTime.current = new Date();
				pos.current.x = obj.current.x;
				pos.current.y = obj.current.y;
				obj.current.x = data.state.objx;
				obj.current.y = data.state.objy;
				timeBeforeHit.current = data.state.time;
				setScore({left: data.state.l_score, right: data.state.r_score});
			}
			if (data.case == "paddle_update" || data.case == "global_update") {
				LPaddle.current.y = data.state.l_paddle;
				RPaddle.current.y = data.state.r_paddle;
			}
		};
		
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
				<h2>{score.left}:{score.right}</h2>
			</div>

			<div className={styles.canvas_container}>
				<canvas ref={canvasRef} width={800} height={500} style={{ border: '5px solid white' }}></canvas>
			</div>

			<div className={styles.centered_container}>
				<p>Speed: {speed.current}</p>
			</div>

		</div>
	);
}

export default OnlinePong;
