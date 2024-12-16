function clamp(val, min, max)
{
	return (Math.min(Math.max(min, val), max));
}

function goBack(bonus, dir, vec, pos, obj, action)
{
	if (action == "add")
	{
		/* Triggering a nextHit() by setting obj to the current pos
		and reversing the direction. */
		bonus.current.timer = 1;
		obj.current = pos.current;
		dir.current *= -1;
	}
}

function speedUp(bonus, speed, action)
{
	if (action == "add")
	{
		// Doubling the speed, storing the old speed
		bonus.current.timer = 1;
		bonus.current.oldSpeed = speed.current;
		speed.current *= 2;
	}
	else if (action == "remove")
	{
		// Returning to the old speed
		speed.current = bonus.current.oldSpeed;
		bonus.current.timer = 1;
	}
}

function slowDown(bonus, speed, action)
{
	if (action == "add")
	{
		// Setting the speed to the minimum, storing the old speed
		bonus.current.timer = 1;
		bonus.current.oldSpeed = speed.current;
		speed.current = 2;
	}
	else if (action == "remove")
	{
		// Returning to the old speed
		speed.current = bonus.current.oldSpeed;
		bonus.current.timer = 1;
	}
}

function biggerPaddle(bonus, dir, LPaddle, RPaddle, action)
{
	if (action == "add")
	{
		// Doubling the paddle's size
		bonus.current.timer = 6;
		if (dir.current == 1) {
			LPaddle.current.size = 240;
			// Preventing the paddle from going out of bound
			LPaddle.current.y = clamp(LPaddle.current.y, 120, 380);
		}
		else {
			RPaddle.current.size = 240;
			// Preventing the paddle from going out of bound
			RPaddle.current.y = clamp(RPaddle.current.y, 120, 380);
		}
	}
	else if (action == "remove")
	{
		// Returning to default size
		LPaddle.current.size = 120;
		RPaddle.current.size = 120;
		bonus.current.timer = 1;
	}
}

function safeWall(bonus, dir, LPaddle, RPaddle, action)
{
	if (action == "add")
	{
		/* Setting the paddle's size to be the max width.
		Nothing is getting through that !*/
		bonus.current.timer = 2;
		if (dir.current == 1) {
			LPaddle.current.size = 500;
			LPaddle.current.y = 250;
		}
		else {
			RPaddle.current.size = 500;
			RPaddle.current.y = 250;
		}
	}
	else if (action == "remove")
	{
		// Returning to default size
		LPaddle.current.size = 120;
		RPaddle.current.size = 120;
		bonus.current.timer = 1;
	}
}

function getRandomBonus(bonus)
{
	// Getting a random bonus value ranging from 0 to 4
	return (Math.floor(Math.random() * 10) % 5);
}

function isBallInRange(pos)
{
	// Is the ball in the range of the bonus box ?
	if ((pos.x >= 375 && pos.x <= 425) && (pos.y >= 225 && pos.y <= 275))
		return (true);
	return (false);
}

export function bonusManager(bonus, pos, obj, dir, vec, LPaddle, RPaddle, speed, type)
{
	if (type == "pos_update")
	{
		// Did the ball hit the bonus box ?
		if (isBallInRange(pos.current) == true && bonus.current.available != "none")
		{
			// If yes, activating the currently available bonus
			bonus.current.bonus = bonus.current.available;
			bonus.current.available = "none";
			switch (bonus.current.bonus)
			{
				case 0: // Paddle becomes double the size for the next three hits
					biggerPaddle(bonus, dir, LPaddle, RPaddle, "add");
					break ;
				case 1: // Ball slow downs until next paddle hit
					slowDown(bonus, speed, "add");
					break ;
				case 2: // Ball is sped up until next paddle hit
					speedUp(bonus, speed, "add");
					break ;
				case 3: // Paddle becomes an impenetrable wall until it's hit
					safeWall(bonus, dir, LPaddle, RPaddle, "add");
					break ;
				case 4: // Ball bounces back
					goBack(bonus, dir, vec, pos, obj, "add");
					break ;
			}
		}
		
	}
	else if (type == "hit_update")
	{
		bonus.current.timer -= 1;
		// Did the ball do enough rebounds to add/remove a bonus ?
		if (bonus.current.timer <= 0)
		{
			// Is a bonus currently applied ?
			if (bonus.current.bonus != "none")
			{
				// Removing the bonus
				switch (bonus.current.bonus)
				{
					case 0: // Paddle becomes double the size for the next three hits
						biggerPaddle(bonus, dir, LPaddle, RPaddle, "remove");
						break ;
					case 1: // Ball slow downs until next paddle hit
						slowDown(bonus, speed, "remove");
						break ;
					case 2: // Ball is sped up until next paddle hit
						speedUp(bonus, speed, "remove");
						break ;
					case 3: // Paddle becomes an impenetrable wall until it's hit
						safeWall(bonus, dir, LPaddle, RPaddle, "remove");
						break ;
					case 4: // Can't remove a bounce
						bonus.current.timer = 1;
						break ;
				}
				bonus.current.bonus = 'none';
			}
			else
			{
				// Adding a bonus to be available (or changing it)
				bonus.current.available = getRandomBonus(bonus);
				bonus.current.timer = 1;
			}
		}
	}
}



// Drawing a small visual representation of the currently available bonus
export function drawBonus(bonus, ctx)
{
	switch (bonus.available)
	{
		case 0: // Bigger Paddle
		{
			// Drawing a small paddle representation
			ctx.fillStyle = 'white';
			ctx.fillRect(387, 242, 3, 15);
			// Add a "zoom effect" with lines pointing to the larger paddle
			ctx.strokeStyle = 'grey';
			ctx.lineWidth = 1;
			// Lines going outward to emphasize size
			ctx.beginPath();
			ctx.moveTo(407, 235); // Top-left of the large paddle
			ctx.lineTo(387, 242); // Top-left of the small paddle
			ctx.moveTo(412, 235); // Top-right of the large paddle
			ctx.lineTo(390, 242); // Top-right of the small paddle
			ctx.moveTo(407, 265); // Bottom-left of the large paddle
			ctx.lineTo(387, 257); // Bottom-left of the small paddle
			ctx.moveTo(412, 265); // Bottom-right of the large paddle
			ctx.lineTo(390, 257); // Bottom-right of the small paddle
			ctx.stroke();
			// Drawing a larger paddle representation to constrast
			ctx.fillStyle = 'white';
			ctx.fillRect(407, 235, 5, 30);
			break ;
		}
		case 1: // Slow Down
		{
			// Drawing a spiral pattern
			ctx.strokeStyle = 'white';
			ctx.lineWidth = 2.5;
			let angle = 0;
			let radius = 0;
			// Slowly expanding spiral
			while (radius < 25)
			{
				const x = 400 + radius * Math.cos(angle);
				const y = 250 + radius * Math.sin(angle);

				if (angle == 0)
				{
					ctx.beginPath();
					ctx.moveTo(x, y);
				}
				else
					ctx.lineTo(x, y);
				angle += 0.1;
				radius += 0.1;
			}
			ctx.stroke();
			break ;
		}
		case 2: // Speed Up
		{
			const X = 375;
			const Y = 225;
			ctx.strokeStyle = 'white';
			ctx.lineWidth = 2;
			// Short trail (slow)
			ctx.beginPath();
			ctx.moveTo(10 + X, 35 + Y);
			ctx.lineTo(15 + X, 35 + Y);
			ctx.stroke();
			// Medium trail (faster)
			ctx.beginPath();
			ctx.moveTo(10 + X, 25 + Y);
			ctx.lineTo(25 + X, 25 + Y);
			ctx.stroke();
			// Long trail (fastest)
			ctx.beginPath();
			ctx.moveTo(10 + X, 15 + Y);
			ctx.lineTo(35 + X, 15 + Y);
			ctx.stroke();
			// Drawing the ball at the end of the longest trail
			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.arc(37 + X, 15 + Y, 4, 0, Math.PI * 2);
			ctx.fill();
			break ;
		}
		case 3: // Safe Wall
		{
			const brickWidth = 11;
			const brickHeight = 5;
			// Drawing a wall, brick after brick
			for (let row = 0; row < 8; row++) {
				for (let col = 0; col < 4; col++) {
					// Offset every other row to create a staggered effect
					const xOffset = (row % 2) * 5;
					const x = col * brickWidth + xOffset + 375;
					const y = row * brickHeight + 230;
					// Drawing a brick
					ctx.fillStyle = 'white';
					ctx.fillRect(x, y, brickWidth, brickHeight);
					// Outline the brick
					ctx.strokeStyle = 'black';
					ctx.strokeRect(x, y, brickWidth, brickHeight);
				}
			}
			break ;
		}
		case 4: // Go Back
		{
			const X = 375;
			const Y = 230;
			// Drawing a simple wall representation
			ctx.fillStyle = 'white';
			ctx.fillRect(30 + X, 5 + Y, 4, 30);
			ctx.fillRect(37 + X, 13 + Y, 2, 14);
			// Drawing the rebound path
			ctx.strokeStyle = 'white';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(13 + X, 33 + Y);
			ctx.lineTo(30 + X, 20 + Y);
			ctx.lineTo(13 + X, 7 + Y);
			ctx.stroke();
			// Drawing a ball
			ctx.fillStyle = 'white';
			ctx.beginPath();
			ctx.arc(13 + X, 7 + Y, 4, 0, Math.PI * 2);
			ctx.fill();
			break ;
		}
	}
}