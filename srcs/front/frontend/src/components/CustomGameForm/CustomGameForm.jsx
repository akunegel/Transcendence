import { useState } from "react";
import api from "../../api";
import styles from "./CustomGameForm.module.css"

function CustomGameForm() {

	const [addBonus, setAddBonus] = useState(false);
	const [hasMaxPoint, setHasMaxPoint] = useState(false);
	const [maxPoint, setMaxPoint] = useState(5);
	const [playerNb, setPlayerNb] = useState(2);
	const [maxTime, setMaxTime] = useState(5);

	console.log(hasMaxPoint);

	return (
		<div className={styles.gameform_container}>

			<div className={styles.gameform_checkbox_container}>
				<input id="BonusCheckbox" type="checkbox" value={addBonus} onChange={() => setAddBonus(addBonus ? false : true)}/>
				<label htmlFor="BonusCheckbox"></label>
				<p>{addBonus ? "Bonus On" : "Bonus Off"}</p>
			</div>

			<div className={styles.gameform_checkbox_container}>
				<input id="MaxPointCheckbox" type="checkbox" value={hasMaxPoint} onChange={() => setHasMaxPoint(hasMaxPoint ? false : true)}/>
				<label htmlFor="MaxPointCheckbox"></label>
				<p>{hasMaxPoint ? "Point limit enabled" : "Point limit disabled"}</p>
			</div>

			{hasMaxPoint &&
				<div className={styles.gameform_number_container}>
					<p>Point limit: {maxPoint}</p>
					<button onClick={() => setMaxPoint(maxPoint >= 15 ? 15 : maxPoint + 1)}>+</button>
					<button onClick={() => setMaxPoint(maxPoint <= 1 ? 1 : maxPoint - 1)}>-</button>
				</div>
			}

		</div>
	)
}

export default CustomGameForm