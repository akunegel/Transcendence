import { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom"
import styles from "./CustomGameForm.module.css"

function CustomGameForm() {

	const navigate = useNavigate();
	const { authTokens } = useContext(AuthContext);
	const [addBonus, setAddBonus] = useState(false);
	const [isPrivate, setIsPrivate] = useState(true);
	const [hasTimeLimit, setHasTimeLimit] = useState(false);
	const [maxTime, setMaxTime] = useState(5);
	const [maxPoint, setMaxPoint] = useState(5);


	const handleSubmit = async (f) => {
		f.preventDefault();

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/createCustomGame/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				},
				body: JSON.stringify({addBonus, isPrivate, hasTimeLimit, maxTime, maxPoint})
			})

			const data = await res.json();
			const room_id = data.room_id;

			if (res.status === 200) {
					navigate(`/play/${room_id}/`);
			}
			else {
				console.error(JSON.stringify(data));
			}
		} catch (error) {
			console.error('Room creation error:', error)
		}
	};

	return (
		<div className={styles.gameform_container}>

			<div className={styles.gameform_checkbox_container}>
				<input id="BonusCheckbox" type="checkbox" value={addBonus} onChange={() => setAddBonus(addBonus ? false : true)}/>
				<label htmlFor="BonusCheckbox"></label>
				<p>Bonuses: {addBonus ? "On" : "Off"}</p>
			</div>
			{addBonus && <p className={styles.info_message}>bonuses will spawn randomly</p>}

			<div className={styles.gameform_checkbox_container}>
				<input id="PrivateCheckbox" type="checkbox" value={isPrivate} onChange={() => setIsPrivate(isPrivate ? false : true)}/>
				<label htmlFor="PrivateCheckbox"></label>
				<p>Room is: {isPrivate ? "Private" : "Public"}</p>
				<p></p>
			</div>
			{!isPrivate && <p className={styles.info_message}>random users will be able to join</p>}

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

			<div className={styles.gameform_number_container}>
				<p>Point limit: </p>
				<button onClick={() => setMaxPoint(maxPoint >= 15 ? 15 : maxPoint + 1)}>+</button>
				<p>{maxPoint}</p>
				<button onClick={() => setMaxPoint(maxPoint <= 1 ? 1 : maxPoint - 1)}>-</button>
			</div>

			<div className={styles.gameform_input_container}>

			</div>

			<div className={styles.start_button}>
				<button onClick={(f) => handleSubmit(f)}>START GAME</button>
			</div>

		</div>
	)
}

export default CustomGameForm