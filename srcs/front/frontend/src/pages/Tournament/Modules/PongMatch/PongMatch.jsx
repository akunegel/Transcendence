import { useState, useEffect, useRef } from 'react';
import { drawBonus } from '../../../Pong/BonusManager.js';
import ImgFallback from '../../../../components/ImgFallback.jsx';
import default_pic from '../../../../assets/images/default_profile_pic.png'
import connexion_lost from '../../../../assets/images/connexion_lost.png'
import styles from './PongMatch.module.css';


function PongMatch({ players, info, opponents, wsRef }) {

	const	canvasRef = useRef(null);
	const	lastUpdateTimeRef = useRef(0);
	const	[statusTitle, setStatusTitle] = useState("- First to " + info.max_point + " wins -");
	const	startTime = useRef(null);
	const	[timer, setTimer] = useState({min: 0, sec: 0});
	const	timerIsRunning = useRef(false);
	const	[timerColor, setTimerColor] = useState("white");

	const	[titleCss, setTitleCss] = useState(styles.status_title_bottom);
	const	messageTime = useRef(0);
	const	timeBeforeHit = useRef(0);
	const	LPaddle = useRef({ x: 50, y: 250, size: 120});
	const	RPaddle = useRef({ x: 750, y: 250, size: 120});
	const	pos = useRef({ x: 400, y: 250 });
	const	obj = useRef({ x: 400, y: 250 });
	const	availableBonus = useRef("none");
	const	[score, setScore] = useState({left: 0, right: 0});
	const	[p1, setP1] = useState(null)
	const	[p2, setP2] = useState(null)

	const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


	useEffect(() => {
		// Displaying any change to the players array
		setP1(() => {
			for (let i = 0; i < players.length; i++) {
				if (players[i].id == opponents.p1)
					return (players[i]);
			}
		});
		setP2(() => {
			for (let i = 0; i < players.length; i++) {
				if (players[i].id == opponents.p2)
					return (players[i]);
			}
		});
	}, [players]);

	// Timer mechanic for maxTime
	useEffect(() => {
		let inter;
		if (timerIsRunning.current) {
			inter = setInterval(() => {
				setTimer((prevTime) => {
					let secSinceStart = Math.floor((new Date() - startTime.current) / 1000);
					let { min, sec } = prevTime;

					min = (info.max_time) - Math.floor(secSinceStart / 60);
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
			setStatusTitle("- Game starting in " + i + " -");
			document.title = i;
			await sleep(1000);
		}
		document.title = "Pong";
	}

	// Adding websocket event listeners
	useEffect(() => {
		if (!wsRef || !wsRef.current)
			return;
	
		const handleMessage = (event) => {
			const msg = JSON.parse(event.data);

			switch (msg.case) {
				case 'begin_countdown':
					// Game is about to start (3 seconds from now)
					setTitleCss(styles.status_title_center);
					displayGameStartTimer()
						.then(() =>{timerIsRunning.current = true;
									setStatusTitle("- First to " + info.max_point + " wins -");
									startTime.current = new Date();
									setTitleCss(styles.status_title_bottom);
						});
					break ;
				case 'ball_update' :
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
				case 'paddle_update' :
					// Receiving the paddles' new position
					LPaddle.current.y = msg.data.l_paddle;
					RPaddle.current.y = msg.data.r_paddle;
					break ;
				case 'end_game':
					// Receiving the winner of the game and stopping the animation display
					LPaddle.current.y, RPaddle.current.y = 250;
					timeBeforeHit.current = 0
					timerIsRunning.current = false;
					drawGame(canvasRef.current.getContext('2d'), 400, 250);
					// Displaying winner's username
					setTitleCss(styles.status_title_center);
					setStatusTitle("- " + msg.data.winner + " is the winner ! -");
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
		if (info.add_bonus == true)
			drawBonusBox(ctx);
		drawBall(ctx, ball_x, ball_y, "white");
	}

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		const animate = (time) =>
		{
			if (time - lastUpdateTimeRef.current > 1000 / 61) {
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

			{p1 && p2 &&
				<div className={styles.top_container}>
					{/* Left Player - p1 */}
					<div className={styles.player_info}>
						{p1.connected ? 
							<ImgFallback	src={p1.img}
											alt="Profil Picture"
											fallback={p1.connected ? default_pic : connexion_lost}
											style={{borderColor: p1.color}}/>
						:
							<img	src={connexion_lost}
									alt="Connexion Lost"
									style={{borderColor: p1.color}}/>
						}
							<p className="m-0" style={{textAlign: "left", borderLeft: 'none', borderColor: p1.color}}>
								{p1.arena_name}
							</p>
					</div>

					{/* Middle Display - Current score or time left */}
					<div className={styles.centered_container} style={{marginTop:"80px"}}>
						{info && info.has_time_limit == true ?
								<h2 className="m-0" style={{borderTop: "5px solid white", color: timerColor}}>{timer.min > 9 ? "" : "0"}{timer.min}:{timer.sec > 9 ? "" : "0"}{timer.sec}</h2>
							:
								<h2 className="m-0" style={{borderTop: "5px solid white"}}> {score.left > 9 ? "" : "0"}{score.left}:{score.right > 9 ? "" : "0"}{score.right} </h2>
							}
					</div>

					{/* Right Player - p2 */}
					<div className={styles.player_info}>
						<p className="m-0" style={{textAlign: "right", borderRight: 'none', borderColor: p2.color}}>
							{p2.arena_name}
						</p>
						{p2.connected ? 
							<ImgFallback	src={p2.img}
											alt="Profil Picture"
											fallback={p2.connected ? default_pic : connexion_lost}
											style={{borderColor: p2.color}}/>
						:
							<img	src={connexion_lost}
									alt="Connexion Lost"
									style={{borderColor: p2.color}}/>
						}
					</div>

				</div>
			}

			{/* Pong Match Display */}
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

			{/* Status Title Display */}
			<div className={titleCss}>
				<p className="m-0">{statusTitle}</p>
			</div>


		</div>
	);
}

export default PongMatch;
