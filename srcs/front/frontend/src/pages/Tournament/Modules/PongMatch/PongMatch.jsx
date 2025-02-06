import { useState, useEffect, useRef } from 'react';
import { drawBonus } from '../../../Pong/BonusManager.js';
import styles from './PongMatch.module.css';


function PongMatch({ players, info, roomId, wsRef }) {

	const	canvasRef = useRef(null);
	const	lastUpdateTimeRef = useRef(0);
	const	[statusTitle, setStatusTitle] = useState("");
	const	startTime = useRef(null);
	const	[timer, setTimer] = useState({min: 0, sec: 0});
	const	timerIsRunning = useRef(false);
	const	[timerColor, setTimerColor] = useState("white");

	const	gameStarted = useRef(false);
	const	messageTime = useRef(0);
	const	timeBeforeHit = useRef(0);
	const	LPaddle = useRef({ x: 50, y: 250, size: 60});
	const	RPaddle = useRef({ x: 750, y: 250, size: 60});
	const	pos = useRef({ x: 400, y: 250 });
	const	obj = useRef({ x: 400, y: 250 });
	const	availableBonus = useRef("none");
	const	[score, setScore] = useState({left: 0, right: 0});


	// Adding websocket event listeners
	useEffect(() => {
		if (!wsRef || !wsRef.current)
			return;
	
		const handleMessage = (event) => {
			const msg = JSON.parse(event.data);
			console.log("SubModule received:", msg);

			switch (msg.case) {
				case 'start_game':
					// Game is about to start (3 seconds from now)
					gameStarted.current = true;
					displayGameStartTimer()
						.then(() =>{timerIsRunning.current = true;
									setStatusTitle("- First to " + rulesRef.current.max_point + " wins -");
									startTime.current = new Date();
						});
					break ;
					
				case 'global_update':
				case 'ball_update' :
					// Receiving the next position of the ball
					messageTime.current = new Date();
					pos.current.x = obj.current.x;
					pos.current.y = obj.current.y;
					obj.current.x = data.state.objx;
					obj.current.y = data.state.objy;
					LPaddle.current.size = data.state.l_paddle_size;
					RPaddle.current.size = data.state.r_paddle_size;
					LPaddle.current.y = data.state.l_paddle;
					RPaddle.current.y = data.state.r_paddle;
					availableBonus.current = data.state.available_bonus;
					timeBeforeHit.current = data.state.time;
					setScore({left: data.state.l_score, right: data.state.r_score});
				case 'paddle_update' :
					// Receiving the paddles' new position
					LPaddle.current.y = data.state.l_paddle;
					RPaddle.current.y = data.state.r_paddle;
					break ;
				case 'end_game':
					// Receiving the winner of the game and stopping the animation display
					gameStarted.current = false;
					LPaddle.current.y, RPaddle.current.y = 250;
					timeBeforeHit.current = 0
					timerIsRunning.current = false;
					drawGame(canvasRef.current.getContext('2d'), 400, 250);
					// Displaying winner's username
					if (data.state.winner)
						setStatusTitle("- " + winner + " is the winner ! -");
					else
						setStatusTitle("- Game Ended In A Draw ! -");
					break ;
				default:
					break ;
			}
		}
	
		wsRef.current.addEventListener("message", handleMessage);
	
		return () => {
			if (wsRef && wsRef.current)
				wsRef.current.removeEventListener("message", handleMessage);
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
	
	return (
		<div className={styles.centered_container}>

			<div className={styles.game_container}>

				<div className={styles.points_container} style={{borderLeft: "5px solid white"}}>
					{Array.from({ length: (info != null ? info.max_point - score.left : 0)}).map((_, index) =>  (<div className={styles.not_point} key={index}/>))}
					{Array.from({ length: score.left}).map((_, index) => (<div className={styles.a_point} key={index}/>))}
				</div>

				<div className={styles.canvas_container}>
					<canvas ref={canvasRef} width={800} height={500}/>
				</div>

				<div className={styles.points_container} style={{borderRight: "5px solid white"}}>
				{Array.from({ length: (info != null ? info.max_point - score.right : 0)}).map((_, index) =>  (<div className={styles.not_point} key={index}/>))}
					{Array.from({ length: score.right}).map((_, index) => (<div className={styles.a_point} key={index}/>))}
				</div>

			</div>


		</div>
	);
}

export default PongMatch;
