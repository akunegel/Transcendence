
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
	let move = 0;
	let dif = obj.y - paddle.y;
	let center_dif = 250 - paddle.y;

	/* If the ball is going in AI's direction : Will try to
	match the ball's next y obj. Otherwise, returns to the center.
	Might make the player cry.*/

	if (dir == 1)
		move = clamp(dif, -5, 5);
	else
		move = clamp(center_dif, -5, 5);

	return (limitMovement(move, paddle.y, paddle.size));
}

function NormalAI(pos, paddle, dir)
{
	let move = 0;
	let dif = pos.y - paddle.y;

	/* If the ball is in the AI's half(+50) of the terrain and coming
	towards it's paddle, it will try to match the ball's current y pos.*/

	if (pos.x > 450 && dir == 1)
		move = clamp(dif, -5, 5);

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
	switch (difficulty)
	{
		case 1:
			return (EasyAI(pos, paddle, dir));
		case 2:
			return (NormalAI(pos, paddle, dir));
		case 3:
			return (HardAI(obj, pos, paddle, dir));
	}
}