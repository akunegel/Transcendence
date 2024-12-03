import { useState, useEffect, useRef } from "react"
import styles from "./MicroPong.module.css"

function MicroPong() {

	const canvasSize = {x: 240, y: 150};
	const canvasRef = useRef(null);
    const pos = useRef({ x: canvasSize.x / 2, y: canvasSize.y / 2 });
    const obj = useRef({ x: canvasSize.x / 2, y: canvasSize.y / 2 });
    const dir = useRef(1);
    const vec = useRef(1.2);
    const speed = useRef(1.5);
	const lastUpdateTimeRef = useRef(0);

	const drawGame = (ctx, x, y) => {

		// Clear last frame
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// Drawing the ball at the given position
		ctx.beginPath();
		ctx.arc(x, y, 10, 0, 2 * Math.PI);
		ctx.fillStyle = 'white';
		ctx.fill();
	};

	const nextHit = () => {
		let newY = vec.current > 0 ? canvasSize.y - 10 : 10;
		let newX = dir.current * ((newY - obj.current.y) / vec.current) + obj.current.x;

		if (newX >= canvasSize.x - 10 || newX <= 10) {
			newX = (newX >= canvasSize.x - 10 ? canvasSize.x - 10 : 10);
			newY = dir.current * (newX - pos.current.x) * vec.current + pos.current.y;
			dir.current *= -1;
		}
		else
			vec.current *= -1;

		obj.current = {x: newX, y: newY};
	};

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		const animate = (time) =>
		{
			if (time - lastUpdateTimeRef.current > 1000 / 61) {
				// Calculating the distance from the current position to the target position
				const dx = obj.current.x - pos.current.x;
				const dy = obj.current.y - pos.current.y;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance <= speed.current) { // Snap to target if close enough, not going further than target
					pos.current.x = obj.current.x;
					pos.current.y = obj.current.y;
					drawGame(context, pos.current.x, pos.current.y);
					nextHit();
				}
				else { // Determine the step's length towards the target, depending on speed
					const angle = Math.atan2(dy, dx);
					const newX = pos.current.x + Math.cos(angle) * speed.current;
					const newY = pos.current.y + Math.sin(angle) * speed.current;
					drawGame(context, pos.current.x, pos.current.y);
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
		<div className={styles.micro_pong}>
			<div className={styles.canvas_container}>
				<canvas ref={canvasRef} width={canvasSize.x} height={canvasSize.y}/>
			</div>
		</div>
	)
}

export default MicroPong