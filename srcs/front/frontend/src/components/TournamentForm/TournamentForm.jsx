import { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom"
import styles from "./TournamentForm.module.css"
import { useTranslation } from "react-i18next";


function TournamentForm() {

	const navigate = useNavigate();
	const { authTokens } = useContext(AuthContext);
	const [noTournamentFound, setNoTournamentFound] = useState(false);
	const [addBonus, setAddBonus] = useState(false);
	const [isPrivate, setIsPrivate] = useState(true);
	const [hasTimeLimit, setHasTimeLimit] = useState(false);
	const [maxTime, setMaxTime] = useState(5);
	const [maxPoint, setMaxPoint] = useState(5);
	const [maxPlayer, setMaxPlayer] = useState(4);
	const { t, i18n } = useTranslation();


	const handleSubmit = async (f) => {
		f.preventDefault();

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/createTournament/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				},
				body: JSON.stringify({addBonus, isPrivate, hasTimeLimit, maxTime, maxPoint, maxPlayer})
			})

			const data = await res.json();
			const tour_id = data.tour_id;

			if (res.status === 200) {
					navigate(`/tournament/${tour_id}/`);
			}
			else {
				console.error(JSON.stringify(data));
			}
		} catch (error) {
			console.error('Room creation error:', error)
		}
	};

	const handleQuickJoin = async (f) => {
		f.preventDefault();

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/quickJoinTournament/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				}
			})

			const data = await res.json();
			const tour_id = data.tour_id;

			if (res.ok) {
				if (tour_id == "None")
					// No free room was found
					setNoTournamentFound(true);
				else // Connecting to the room
					navigate(`/tournament/${tour_id}/`);
			}
			else
				console.error(JSON.stringify(data));
		}
		catch (error) {
			console.error('Quick join error:', error)
		}
	};

	return (
		<>
			{noTournamentFound && <p className="m-0" style={{color:'white', fontWeight:'bold'}}>{t("[ No tournament found ]")}</p>}
			<div className={styles.gameform_container}>

				{/* Turn bonuses on/off */}
				<div className={styles.gameform_checkbox_container}>
					<input id="BonusCheckbox" type="checkbox" value={addBonus} onChange={() => setAddBonus(addBonus ? false : true)}/>
					<label htmlFor="BonusCheckbox"></label>
					<p className="m-0">{t("Bonuses")}: {addBonus ? t("On") : t("Off")}</p>
				</div>
				<div className={styles.info_message}>
					<p className="m-0">{addBonus ? t("bonuses will spawn randomly") : " "}</p>
				</div>

				{/* Turn tournament status private/public */}
				<div className={styles.gameform_checkbox_container}>
					<input id="PrivateCheckbox" type="checkbox" value={isPrivate} onChange={() => setIsPrivate(isPrivate ? false : true)}/>
					<label htmlFor="PrivateCheckbox"></label>
					<p className="m-0">{t("Tournament is")}: {isPrivate ? t("Private") : t("Public")}</p>
				</div>
				<div className={styles.info_message}>
					<p className="m-0">{isPrivate ? " " : t("random users will be able to join")}</p>
				</div>

				{/* Turn time limit on/off */}
				<div className={styles.gameform_checkbox_container}>
					<input id="timeLimitCheckBox" type="checkbox" value={hasTimeLimit} onChange={() => setHasTimeLimit(hasTimeLimit ? false : true)}/>
					<label htmlFor="timeLimitCheckBox"></label>
					<p className="m-0">{t("Time limit")}: {hasTimeLimit ? "" : t("disabled")}</p>
					{/* Set time limit */}
					{hasTimeLimit &&
						<div className={styles.gameform_number_container}>
							<button onClick={() => setMaxTime(maxTime >= 5 ? 5 : maxTime + 1)}>+</button>
							<p className="m-0">{maxTime}m</p>
							<button onClick={() => setMaxTime(maxTime <= 1 ? 1 : maxTime - 1)}>-</button>
						</div>
					}
				</div>
				
				{/* Set point limit */}
				<div className={styles.gameform_number_container} style={{margin: '16px', marginLeft: '23px', justifyContent: 'left'}}>
					<p className="m-0">{t("Point limit")}: </p>
					<button onClick={() => setMaxPoint(maxPoint >= 5 ? 5 : maxPoint + 1)}>+</button>
					<p className="m-0">{maxPoint}</p>
					<button onClick={() => setMaxPoint(maxPoint <= 1 ? 1 : maxPoint - 1)}>-</button>
				</div>

				{/* Set player limit */}
				<div className={styles.gameform_number_container} style={{margin: '16px', marginTop: '0px', marginLeft: '23px', justifyContent: 'left'}}>
					<p className="m-0">{t("Max players")}: </p>
					<button onClick={() => setMaxPlayer(8)}>+</button>
					<p className="m-0">{maxPlayer}</p>
					<button onClick={() => setMaxPlayer(4)}>-</button>
				</div>

				<div className={styles.start_button}>
					<button onClick={(f) => handleSubmit(f)}>{t("START TOURNAMENT")}</button>
				</div>
				<div className={styles.start_button}>
					<button onClick={(f) => handleQuickJoin(f)}>{t("QUICK JOIN")}</button>
				</div>

			</div>
		</>
	)
}

export default TournamentForm