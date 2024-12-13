import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Pong from "../Pong/Pong.jsx";
import styles from "./LocalPong.module.css"

function LocalPong() {

	const [gameStarted, setGameStarted] = useState(false);
	const [addBonus, setAddBonus] = useState(false);
	const [hasTimeLimit, setHasTimeLimit] = useState(false);
	const [maxTime, setMaxTime] = useState(5);
	const [maxPoint, setMaxPoint] = useState(5);
	const [gameParameters, setGameParameters] = useState(null);
	const [againstAI, setAgainstAI] = useState(false);
	const [difficulty, setDifficulty] = useState(1);
	const navigate = useNavigate();

	const handleReturn = () => {
		navigate("/home");
	}

	const difficultyMessage = () => {
		// Setting a word representation of the difficulty level
		switch(difficulty)
		{
			case 1:
				return "Easy";
			case 2:
				return "Normal";
			case 3:
				return "Hard";
		}
	}

	const handleStart = () => {
		// GameParameters are sent to the Pong module as parameters
		setGameParameters({
				addBonus: addBonus,
				hasTimeLimit: hasTimeLimit,
				maxTime: maxTime,
				maxPoint: maxPoint,
				againstAI: againstAI,
				difficulty: difficulty,
			});
		setGameStarted(true);
	};

	return (
		<div className={styles.centered_container}>

			{gameStarted == true ? <Pong param={gameParameters}/> :
			<>
				<div className={styles.titles_display} style={{marginTop:"80px"}}>
					<h2 className="m-0">00-00</h2>
					<p className="m-0">- Customize your game -</p>
				</div>

				<div className={styles.gameform_container}>

					{/* Toggle bonus checkbox */}
					<div className={styles.gameform_checkbox_container}>
						<input id="BonusCheckbox" type="checkbox" value={addBonus} onChange={() => setAddBonus(addBonus ? false : true)}/>
						<label htmlFor="BonusCheckbox"></label>
						<p className="m-0">Bonuses: {addBonus ? "On" : "Off"}</p>
					</div>
					{addBonus &&	<div className={styles.info_message}>
										<p className="m-0">bonuses will spawn randomly</p>
									</div>}
		
					{/* Toggle time limit checkbox */}
					<div className={styles.gameform_checkbox_container}>
						<input id="timeLimitCheckBox" type="checkbox" value={hasTimeLimit} onChange={() => setHasTimeLimit(hasTimeLimit ? false : true)}/>
						<label htmlFor="timeLimitCheckBox"></label>
						<p className="m-0">Time limit: {hasTimeLimit ? "enabled" : "disabled"}</p>
					</div>
					{/* Set time limit buttons */}
					{hasTimeLimit &&
						<div className={styles.gameform_number_container}>
							<p className="m-0">Time limit:</p> <br/>
							<button onClick={() => setMaxTime(maxTime >= 15 ? 15 : maxTime + 1)}>+</button>
							<p className="m-0">{maxTime}m</p>
							<button onClick={() => setMaxTime(maxTime <= 1 ? 1 : maxTime - 1)}>-</button>
						</div>
					}
					
					{/* Toggle AI opponent checkbox */}
					<div className={styles.gameform_checkbox_container}>
						<input id="AICheckBox" type="checkbox" value={againstAI} onChange={() => setAgainstAI(againstAI ? false : true)}/>
						<label htmlFor="AICheckBox"></label>
						<p className="m-0">AI opponent: {againstAI ? "enabled" : "disabled"}</p>
					</div>
					{againstAI &&
						<div className={styles.gameform_number_container}>
							<p className="m-0">Difficulty:</p> <br/>
							<button onClick={() => setDifficulty(difficulty >= 3 ? 3 : difficulty + 1)}>+</button>
							<p className="m-0" style={{width: '55px'}}>{difficultyMessage()}</p>
							<button onClick={() => setDifficulty(difficulty <= 1 ? 1 : difficulty - 1)}>-</button>
						</div>
					}
		
					{/* Set point limit checkbox */}
					<div className={styles.gameform_number_container}>
						<p className="m-0">Point limit: </p>
						<button onClick={() => setMaxPoint(maxPoint >= 15 ? 15 : maxPoint + 1)}>+</button>
						<p className="m-0">{maxPoint}</p>
						<button onClick={() => setMaxPoint(maxPoint <= 1 ? 1 : maxPoint - 1)}>-</button>
					</div>
		
					{/* Start and Return buttons */}
					<div className={styles.text_button} style={{marginTop:'80px'}}>
						<button onClick={() => handleStart()}>START GAME</button>
					</div>

					<div className={styles.text_button} style={{marginTop:'42px'}}>
						<button onClick={() => handleReturn()}>RETURN</button>
					</div>

				</div>
			</>
			}
			{gameStarted ?
				<div className={styles.exit_button}>
					<button onClick={() => setGameStarted(false)}>EXIT</button>
				</div>
			:
				<div className={styles.info_message} style={{border: '5px solid white', borderTop: 'none', backgroundColor: 'black'}}>
				{againstAI ? <p className="m-0" style={{color: 'white'}}>- Controls: up: arrowUp down: arrowDown -</p>
						   : <p className="m-0" style={{color: 'white'}}>- Controls: up: E down: D | up: arrowUp down: arrowDown -</p>}
				</div>
			}

		</div>
	)

}

export default LocalPong