
function findNextRebound(obj, vec, dir, n)
{
	// If the trajectory is going to paddle level, no need for more iterations (also caped at n iterations)
	if (obj.x == 750 || n <= 0)
		return (obj);
	let newY = vec > 0 ? 491.1 : 9.1;
	let newX = dir * ((newY - obj.y) / vec) + obj.x;

	// Checking if the ball is going past a paddle, setting the next position no further than paddle level
	if (((newX > 750 && dir == 1) || (newX < 50 && dir == -1)))
	{
		newX = newX > 750 ? 750 : 50;
		newY = dir * (newX - obj.x) * vec + obj.y;
	}
	return (findNextRebound({x: newX, y: newY}, (vec * -1), dir, (n - 1)));
}

function limitMovement(move, y, size)
{
	// Avoiding the paddle from going out of bounds
	if (y + move < (size / 2) || y + move > (500 - (size / 2)))
		return (0);

	return (move);
}

function clamp(val, min, max)
{
	return (Math.min(Math.max(min, val), max));
}

function HardAI(obj, pos, paddle, dir)
{
	/* If the ball is going in AI's direction : Will try to
	match the ball's next y obj. Otherwise, returns to the center.*/

	let move = 0;

	if (dir == 1)
	{
		let nextRebound = findNextRebound(obj, (((obj.y - pos.y) / (obj.x - pos.x)) * -1), dir, 1);
		let dif = nextRebound.y - paddle.y;
		move = clamp(dif, -5, 5);
	}
	else
	{
		let center_dif = 250 - paddle.y;
		move = clamp(center_dif, -5, 5);
	}

	return (limitMovement(move, paddle.y, paddle.size));
}

function NormalAI(obj, pos, paddle, dir)
{
	/* If the ball is going in AI's direction : Will try to
	match the ball's next y obj. Otherwise, returns to the center.
	This AI depends on gameViewAi, it will refresh it's information
	on the gamestate every seconds*/

	let move = 0;

	if (dir == 1)
	{
		let nextRebound = findNextRebound(obj, (((obj.y - pos.y) / (obj.x - pos.x)) * -1), dir, 1);
		let dif = nextRebound.y - paddle.y;
		move = clamp(dif, -5, 5);
	}
	else
	{
		let center_dif = 250 - paddle.y;
		move = clamp(center_dif, -5, 5);
	}

	return (limitMovement(move, paddle.y, paddle.size));
}

function EasyAI(pos, paddle, dir)
{
	let move = 0;
	let dif = pos.y - paddle.y;

	/* If the ball is in the AI's half(-50) of the terrain and coming
	towards it's paddle, it will try to match the ball's current y pos.*/

	if (pos.x > 600 && dir == 1)
		move = clamp(dif, -5, 5);

	return (limitMovement(move, paddle.y, paddle.size));
}

export function AI_paddleMovement(difficulty, obj, pos, paddle, dir)
{
	// No need for action before start
	if (obj.x == 400 && obj.y == 250)
		return (0);

	switch (difficulty)
	{
		case 1:
			return (EasyAI(pos, paddle, dir));
		case 2:
			return (NormalAI(obj, pos, paddle, dir));
		case 3:
			return (HardAI(obj, pos, paddle, dir));
	}
}