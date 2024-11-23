import { useParams } from "react-router-dom";
import React, { useState, useEffect, useRef } from 'react';
import styles from './OnlinePong.module.css';
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";


function OnlinePong() {
	
	const canvasRef = useRef(null);
	const keys = useRef({ up: false, down: false});
	const LPaddle = useRef({ x: 50, y: 250});
	const RPaddle = useRef({ x: 750, y: 250});
	const [score, setScore] = useState({left: 0, right: 0});
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
	
	
	// Setting the tab on mount
	useEffect(() => {
		document.title = "Pong";
		console.log("Room ID:", roomId);
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
			console.log("Game update:", data);

			gameStarted.current = data.state.game_started;
			// pos.current.x = obj.current.x;
			// pos.current.y = obj.current.y;
			obj.current.x = data.state.objx;
			obj.current.y = data.state.objy;
			LPaddle.current.y = data.state.l_paddle;
			RPaddle.current.y = data.state.r_paddle;
		};
		
		wsRef.current.onclose = () => {
			console.log("WebSocket disconnected");
			navigate("/lobby");
		};
	}, []);
	
	useEffect(() => {
		
		// Listens for KeyDown event
		const handleKeyDown = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.up = true;
					break;
				case 'ArrowDown':
					keys.current.down = true;
					break;
			}
		};

		// Listens for KeyUp event
		const handleKeyUp = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.up = false;
					break;
				case 'ArrowDown':
					keys.current.down = false;
					break;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.addEventListener('keyup', handleKeyUp);
		};
	}, []);

	const handlePaddlesMovement = () =>
	{
		// Moves the paddles in the corresponding direction depending on pressed keys
		// See handleKeyUp() and handleKeyDown() above
		if (keys.current.up)
			wsRef.current.send(JSON.stringify({ action: "move_up" }));
			
		if (keys.current.down)
			wsRef.current.send(JSON.stringify({ action: "move_down" }));
	}

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

	const drawGame = (ctx) =>
	{
		// Fill background in black
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.fillStyle = 'black';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		// Drawing center lines for esthetics (looks nice, right ?)
		ctx.beginPath();
		for (let i = 0; i != 500; i += 10)
			ctx.rect(398, i, 4, 1);
		ctx.fillStyle = 'grey';
		ctx.fill();

		// Drawing non-static game elements
		drawPaddle(ctx, LPaddle.current.x - 10, LPaddle.current.y);
		drawPaddle(ctx, RPaddle.current.x, RPaddle.current.y);
		drawBall(ctx, pos.current.x, pos.current.y);
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
				const distance = Math.sqrt(dx * dx + dy * dy);

				// The game is more fun when you can move the paddles
				handlePaddlesMovement();

				if (distance <= speed.current) { // Snap to target if close enough, not going further than target
					pos.current.x = obj.current.x;
					pos.current.y = obj.current.y;
					drawGame(context);
				}
				else { // Determine the step's length towards the target, depending on speed
					const angle = Math.atan2(dy, dx);
					const newX = pos.current.x + Math.cos(angle) * speed.current;
					const newY = pos.current.y + Math.sin(angle) * speed.current;
					drawGame(context);
					pos.current = {x: newX, y: newY};
					lastUpdateTimeRef.current = time;
				}	
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

			<canvas ref={canvasRef} width={800} height={500} style={{ border: '5px solid white' }}></canvas>

			<div className={styles.centered_container}>
				<p>Speed: {speed.current}</p>
			</div>

		</div>
	);
}

export default OnlinePong;
