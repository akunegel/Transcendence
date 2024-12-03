import React, { useState, useEffect, useRef } from 'react';
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
	const [againstAi, setAgainstAi] = useState(false);
	const [difficulty, setDifficulty] = useState(1);
	const navigate = useNavigate();

	const handleReturn = () => {
		navigate("/home");
	}

	const difficultyMessage = () => {
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
		setGameParameters({
				addBonus: addBonus,
				hasTimeLimit: hasTimeLimit,
				maxTime: maxTime,
				maxPoint: maxPoint,
			});
		setGameStarted(true);
	};

	return (
		<div className={styles.centered_container}>

			{gameStarted == true ? <Pong param={gameParameters}/> :
			<>
				<div className={styles.titles_display} style={{marginTop:"80px"}}>
					<h2>00-00</h2>
					<p>- Customize your game -</p>
				</div>

				<div className={styles.gameform_container}>

					{/* Toggle bonus checkbox */}
					<div className={styles.gameform_checkbox_container}>
						<input id="BonusCheckbox" type="checkbox" value={addBonus} onChange={() => setAddBonus(addBonus ? false : true)}/>
						<label htmlFor="BonusCheckbox"></label>
						<p>Bonuses: {addBonus ? "On" : "Off"}</p>
					</div>
					{addBonus &&	<div className={styles.centered_container}>
										<p className={styles.info_message}>bonuses will spawn randomly</p>
									</div>}
		
					{/* Toggle time limit checkbox */}
					<div className={styles.gameform_checkbox_container}>
						<input id="timeLimitCheckBox" type="checkbox" value={hasTimeLimit} onChange={() => setHasTimeLimit(hasTimeLimit ? false : true)}/>
						<label htmlFor="timeLimitCheckBox"></label>
						<p>Time limit: {hasTimeLimit ? "enabled" : "disabled"}</p>
					</div>
					{hasTimeLimit &&
						<div className={styles.gameform_number_container}>
							<p>Time limit:</p> <br/>
							<button onClick={() => setMaxTime(maxTime >= 15 ? 15 : maxTime + 1)}>+</button>
							<p>{maxTime}m</p>
							<button onClick={() => setMaxTime(maxTime <= 1 ? 1 : maxTime - 1)}>-</button>
						</div>
					}
					
					{/* Toggle AI opponent checkbox */}
					<div className={styles.gameform_checkbox_container}>
						<input id="AICheckBox" type="checkbox" value={againstAi} onChange={() => setAgainstAi(againstAi ? false : true)}/>
						<label htmlFor="AICheckBox"></label>
						<p>AI opponent: {againstAi ? "enabled" : "disabled"}</p>
					</div>
					{againstAi &&
						<div className={styles.gameform_number_container}>
							<p>Difficulty:</p> <br/>
							<button onClick={() => setDifficulty(difficulty >= 3 ? 3 : difficulty + 1)}>+</button>
							<p style={{width: '55px'}}>{difficultyMessage()}</p>
							<button onClick={() => setDifficulty(difficulty <= 1 ? 1 : difficulty - 1)}>-</button>
						</div>
					}
		
					{/* Set point limit checkbox */}
					<div className={styles.gameform_number_container}>
						<p>Point limit: </p>
						<button onClick={() => setMaxPoint(maxPoint >= 15 ? 15 : maxPoint + 1)}>+</button>
						<p>{maxPoint}</p>
						<button onClick={() => setMaxPoint(maxPoint <= 1 ? 1 : maxPoint - 1)}>-</button>
					</div>
		
					<div className={styles.gameform_input_container}>
		
					</div>
		
					<div className={styles.text_button} style={{marginTop:'80px'}}>
						<button onClick={() => handleStart()}>START GAME</button>
					</div>

					<div className={styles.text_button} style={{marginTop:'50px'}}>
						<button onClick={() => handleReturn()}>RETURN</button>
					</div>

				</div>
			</>
			}
			{gameStarted == true ?
				<div className={styles.exit_button}>
					<button onClick={() => setGameStarted(false)}>EXIT</button>
				</div> : <></>}

		</div>
	)

}

export default LocalPong