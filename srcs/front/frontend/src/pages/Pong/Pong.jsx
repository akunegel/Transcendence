import React, { useState, useEffect, useRef } from 'react';
import styles from './Pong.module.css';
import {AI_paddleMovement} from "./OpponentAi.js"
import {bonusManager, drawBonus} from './BonusManager.js';

function Pong({ param }) {

	const	[displayScore, setDisplayScore] = useState({left: 0, right: 0});
	const	[timer, setTimer] = useState({min: param.maxTime, sec: 0});
	const	timerIsRunning = useRef(false);
	const	[timerColor, setTimerColor] = useState("white");
	const	[statusTitle, setStatusTitle] = useState("- Game starting in 3 -");

	const	keys = useRef({ lu: false, ld: false, ru: false, rd: false});
	const	LPaddle = useRef({ x: 50, y: 250, size: 120});
	const	RPaddle = useRef({ x: 750, y: 250, size: 120});
	const	pos = useRef({ x: 400, y: 250 });
	const	obj = useRef({ x: 400, y: 250 });
	const	dir = useRef(1);
	const	vec = useRef(0.005);
	const	speed = useRef(2);
	const	score = useRef({left: 0, right: 0});
	const	bonus = useRef({available: "none", bonus: "none", timer: 3, oldSpeed: 2});
	
	const	canvasRef = useRef(null);
	const	gameLoop = useRef(false);
	const	lastUpdateTimeRef = useRef(0);

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	// Timer mechanic for maxTime
	useEffect(() => {
		let inter;
		if (timerIsRunning.current) {
			inter = setInterval(() => {
				setTimer((prevTime) => {
					let { min, sec } = prevTime;
					if (min <= 0 && sec <= 0) {
						setTimerColor(() => {return "darkred"});
						timerIsRunning.current = false;
					}
					else {
						sec -= 1;
						if (sec < 0) {
							min -= 1;
							sec = 59;
						}
					}
					return { min, sec };
				});
			}, 1000);
		}
		return () => clearInterval(inter); // Cleanup on unmount or when isRunning changes
	  }, [timerIsRunning.current]);

	useEffect(() => {
		// Drawing the game on mount for display
		drawGame(canvasRef.current.getContext('2d'));
		// Setting the tab's title
		document.title = "Pong";
		// Then, starting the game
		startGame();
	}, []);

	useEffect(() => {

		// Listens for KeyDown event
		const handleKeyDown = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.ru = true;
					break;
				case 'ArrowDown':
					keys.current.rd = true;
					break;
				case 'e':
					keys.current.lu = true;
					break;
				case 'd':
					keys.current.ld = true;
					break;
			}
		};

		// Listens for KeyUp event
		const handleKeyUp = (event) => {
			switch (event.key)
			{
				case 'ArrowUp':
					keys.current.ru = false;
					break;
				case 'ArrowDown':
					keys.current.rd = false;
					break;
				case 'e':
					keys.current.lu = false;
					break;
				case 'd':
					keys.current.ld = false;
					break;
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	const handlePaddlesMovement = () =>
	{
		// Moves the paddles in the corresponding direction depending on pressed keys
		// See handleKeyUp() and handleKeyDown() above

		// Against an AI, arrow keys become bound to the left paddle, the AI to the right.
		if (param.againstAI == true)
		{
			if (keys.current.ru)
				LPaddle.current.y += (LPaddle.current.y <= (LPaddle.current.size / 2) ? 0 : -5);
			if (keys.current.rd)
				LPaddle.current.y += (LPaddle.current.y >= (500 - (LPaddle.current.size / 2)) ? 0 : 5);

			// Gets the movement determined by the AI
			RPaddle.current.y += AI_paddleMovement(param.difficulty, obj.current, pos.current, RPaddle.current, dir.current);
		}
		else // E and D keys are bound to left paddle, arrow keys to the right.
		{
			if (keys.current.lu)
				LPaddle.current.y += (LPaddle.current.y <= (LPaddle.current.size / 2) ? 0 : -5);
			if (keys.current.ld)
				LPaddle.current.y += (LPaddle.current.y >= (500 - (LPaddle.current.size / 2)) ? 0 : 5);
			if (keys.current.ru)
				RPaddle.current.y += (RPaddle.current.y <= (RPaddle.current.size / 2) ? 0 : -5);
			if (keys.current.rd)
				RPaddle.current.y += (RPaddle.current.y >= (500 - (RPaddle.current.size / 2)) ? 0 : 5);
		}
	}

	const upBallSpeed = () => {
		// gotta go fast
		speed.current = (speed.current >= 100 ? 100 : speed.current + 1);
	};

	const isGameOver = () => {
		
		// Checking if one of the players hit the target score
		if (score.current.left >= param.maxPoint)
			setStatusTitle(param.againstAI ? "- You Win This Game ! -" : "- Left Player Wins ! -");
		else if (score.current.right >= param.maxPoint)
			setStatusTitle("- " + (param.againstAI ? "AI" : "Right") + " Player Wins ! -");
		else if (param.hasTimeLimit == true && timerIsRunning.current == false)
		{
			// If a time limit has been set and is over, display the winner
			if (score.current.left > score.current.right)
				setStatusTitle(param.againstAI ? "- You Win This Game ! -" : "- Left Player Wins ! -");
			else if (score.current.right > score.current.left)
				setStatusTitle("- " + (param.againstAI ? "AI" : "Right") + " Player Wins ! -");
			else
				setStatusTitle("- Game Ended In A Draw ! -");
		}
		else
			return (false);
		timerIsRunning.current = false;
		return (true);
	}

	const playAgain = () => {

		// Adding score depending on the position of the ball, x=791.1 would be the right side, x=9 for left
		if (pos.current.x == 791.1)
			score.current = {left: score.current.left + 1, right: score.current.right}
		else
			score.current = {left: score.current.left, right: score.current.right + 1};
		
		// Resets the gamestate to play again (except scores)
		speed.current = 2;
		pos.current = ({ x: 400, y: 250 });
		obj.current = ({ x: 400, y: 250 });
		LPaddle.current = ({ x: 50, y: 250, size: 120});
		RPaddle.current = ({ x: 750, y: 250, size: 120});
		vec.current = 0.005;

		if (param.addBonus == true)
			bonus.current = {available: "none", bonus: "none", timer: 3, oldSpeed: 2};
		
		setDisplayScore(score.current);
		if (isGameOver() == true)
			gameLoop.current = false;
	}

	
	async function startGame() {
		
		// 3 seconds delay before game starts
		for(let i = 3; i != 0; i--){
			setStatusTitle("- Game starting in " + i + " -");
			await sleep(1000);
		}
		setStatusTitle("- First to " + param.maxPoint + " wins -")
		// Starting timer if a time limit is set
		if (param.hasTimeLimit == true)
			timerIsRunning.current = true;
		// Unblocking the game loop (in animate())
		gameLoop.current = true;
	}

	const drawBonusBox = (ctx) => {
		// Drawing a box in the center to hold the current bonus
		ctx.beginPath();
		ctx.rect(375, 225, 50, 50);
		ctx.fillStyle = 'white';
		ctx.fill();
		ctx.clearRect(380, 230, 40, 40);
		// Drawing a visual for the bonus
		if (bonus.current.available != "none")
			drawBonus(bonus.current.available, ctx);
	}

	const drawBall = (ctx, x, y) => {
		// Drawing the ball at the given position
		ctx.beginPath();
		ctx.arc(x, y, 10, 0, 2 * Math.PI);
		ctx.fillStyle = 'white';
		ctx.fill();
	};

	const drawPaddle = (ctx, x, y, size) => {
		// Drawing a paddle centered at the given position
		ctx.beginPath();
		ctx.rect(x, y - (size / 2), 10, size);
		ctx.fillStyle = 'white';
		ctx.fill();
	}

	const drawGame = (ctx) =>
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
		if (param.addBonus == true)
			drawBonusBox(ctx);
		drawBall(ctx, pos.current.x, pos.current.y);
	}

	function isPaddleAtLevel(side, y) {
		
		// Getting the concerned paddle's y depending on direction
		let paddleY = (side == 1 ? RPaddle.current.y : LPaddle.current.y);
		let size = (side == 1 ? RPaddle.current.size : LPaddle.current.size);

		// When at a paddle's x value, checks if the ball y value is inside the paddel's range to allow rebound
		if (y > paddleY + ((size / 2) + 5) || y < paddleY - ((size / 2) + 5))
			return (false);
		return (true);
	}

	function getNewVector(side, y) {

		let paddleY = (side == 1 ? RPaddle.current.y : LPaddle.current.y);
		let size = (side == 1 ? RPaddle.current.size : LPaddle.current.size)
		let newVec = 2 * (Math.abs(paddleY - y) / (size / 2));

		// A new vector is assigned relative to the location of a hit on a paddle
		newVec = (newVec < 0.05 ? 0.05 : newVec);
		newVec *= (paddleY - y > 0 ? -1 : 1);
		return (newVec);
	}

	const nextHit = () => {

		// Setting next hit position
		let newY = vec.current > 0 ? 491.1 : 9.1;
		let newX = dir.current * ((newY - obj.current.y) / vec.current) + obj.current.x;

		// Checking if the ball is going past a paddle, setting the next position no further than paddle level
		if (((newX > 750 && dir.current == 1) || (newX < 50 && dir.current == -1)) && pos.current.x < 750 && pos.current.x > 50)
		{
			newX = newX > 750 ? 750 : 50;
			newY = dir.current * (newX - obj.current.x) * vec.current + obj.current.y;

		} // Or, if at paddle level, checking if the ball is going to rebound or score a point
		else if (obj.current.x == 750 || obj.current.x == 50)
		{
			// And if this side's paddle is in range, the ball bounces off
			if (isPaddleAtLevel(dir.current, pos.current.y) == true)
			{
				vec.current = getNewVector(dir.current, pos.current.y);
				dir.current *= -1;
				newY = vec.current > 0 ? 491.1 : 9.1;
				newX = dir.current * ((newY - obj.current.y) / vec.current) + obj.current.x;
				if (newX >= 750 || newX <= 50) {
					newX = (newX >= 750 ? 750 : 50);
					newY = dir.current * (newX - pos.current.x) * vec.current + pos.current.y;
				}
				upBallSpeed();
				// Bonus manager, removing a rebound from timer
				if (param.addBonus == true)
					bonusManager(bonus, pos, obj, dir, vec, LPaddle, RPaddle, speed, "hit_update");
			}
			else // Otherwise, the ball goes to score a point
			{
				if (newX >= 791 || newX <= 9) {
					newX = (newX >= 791 ? 791.1 : 9);
					newY = dir.current * (newX - pos.current.x) * vec.current + pos.current.y;
					dir.current *= -1;
				}
				else
					vec.current *= -1;
			}
		}
		else // Or rebound didn't need any specific verification
		{
			if (newX >= 750 || newX <= 50) {
				// if (pos.current.x >= 750 || pos.current.x <= 50)
				if (pos.current.x > 750 || pos.current.x < 50)
					newX = (newX >= 750 ? 791.1 : 9);
				else
					newX = (newX >= 750 ? 750 : 50);
				newY = dir.current * (newX - pos.current.x) * vec.current + pos.current.y;
				dir.current *= -1;
			}
			else
				vec.current *= -1;
		}

		// Old objective becomes new position, setting the new objective
		pos.current = obj.current;
		obj.current = {x: newX, y: newY};
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		const animate = (time) =>
		{
			if (gameLoop.current == true && time - lastUpdateTimeRef.current > 1000 / 61) {
				// Calculating the distance from the current position to the target position
				const dx = obj.current.x - pos.current.x;
				const dy = obj.current.y - pos.current.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				// This game is way more fun if you can move the paddles
				handlePaddlesMovement();
				
				// Checking if the ball hit the bonus box
				if (param.addBonus == true)
					bonusManager(bonus, pos, obj, dir, vec, LPaddle, RPaddle, speed, "pos_update");

				if (distance <= speed.current) {
					// Snap to obj if close enough, not going further than target
					pos.current.x = obj.current.x;
					pos.current.y = obj.current.y;
					drawGame(context);
					// Checking if the ball has scored a point
					if (pos.current.x == 791.1 || pos.current.x == 9)
						playAgain();
					nextHit();
				}
				else {
					// Determine the step's length towards the target, depending on speed
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

			{/* Point counter or timer (top) and status title */}
			<div className={styles.centered_container} style={{marginTop:"80px"}}>
				{param.hasTimeLimit == true ?
					<h2 className="m-0" style={{color: timerColor}}>{timer.min > 9 ? "" : "0"}{timer.min}:{timer.sec > 9 ? "" : "0"}{timer.sec}</h2>
				:
					<h2 className="m-0">{displayScore.left > 9 ? "" : "0"}{displayScore.left}-{displayScore.right > 9 ? "" : "0"}{displayScore.right}</h2>
				}	
				<p className="m-0">{statusTitle}</p>
			</div>

			<div className={styles.game_container}>

				{/* Point counter (left) */}
				<div className={styles.points_container} style={{borderLeft: "5px solid white"}}>
					{Array.from({ length: (param.maxPoint - displayScore.left)}).map((_, index) =>  (<div className={styles.not_point} key={index}/>))}
					{Array.from({ length: displayScore.left}).map((_, index) => (<div className={styles.a_point} key={index}/>))}
				</div>

				{/* Game display  [' °'] */}
				<div className={styles.canvas_container}>
					<canvas ref={canvasRef} width={800} height={500}/>
				</div>

				{/* Point counter (right) */}
				<div className={styles.points_container} style={{borderRight: "5px solid white"}}>
					{Array.from({ length: (param.maxPoint - displayScore.right)}).map((_, index) =>  (<div className={styles.not_point} key={index}/>))}
					{Array.from({ length: displayScore.right}).map((_, index) => (<div className={styles.a_point} key={index}/>))}
				</div>

			</div>

		</div>
	);
}

export default Pong;
