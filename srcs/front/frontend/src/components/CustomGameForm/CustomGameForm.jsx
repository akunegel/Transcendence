import { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next";
import styles from "./CustomGameForm.module.css"

function CustomGameForm({ 
	invitedUser = null, 
	onClose = () => {}, 
	ws = null 
}) {
	const navigate = useNavigate();
	const { user, authTokens } = useContext(AuthContext);
	const [addBonus, setAddBonus] = useState(false);
	const [isPrivate, setIsPrivate] = useState(true);
	const [hasTimeLimit, setHasTimeLimit] = useState(false);
	const [maxTime, setMaxTime] = useState(5);
	const [maxPoint, setMaxPoint] = useState(5);
	const { t, i18n } = useTranslation();

	const handleSubmit = async (f) => {
		f.preventDefault();

		try {
			const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/createCustomGame/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				},
				body: JSON.stringify({
					addBonus, 
					isPrivate, 
					hasTimeLimit, 
					maxTime, 
					maxPoint, 
					invited_user: invitedUser
				})
			})

			const data = await res.json();
			const room_id = data.room_id;

			if (res.status === 200) {
				if (invitedUser && ws && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({
						username: user.username,
						message: t("Click here to play against") + user.username,
						game_invite: {
							room_id: room_id,
							inviter: user.username
						}
					}));
				}

				navigate(`/play/${room_id}/`);
			} else {
				console.error(JSON.stringify(data));
			}
		} catch (error) {
			console.error('Room creation error:', error)
		}
	};

	return (
		<div className={styles.gameform_container}>
			{invitedUser && (
				<div className={styles.invite_header}>
					<p>{t("Inviting")}: {invitedUser}</p>
					<button onClick={onClose}>{t("Cancel")}</button>
				</div>
			)}

			<div className={styles.gameform_checkbox_container}>
				<input 
					id="BonusCheckbox" 
					type="checkbox" 
					checked={addBonus}
					onChange={() => setAddBonus(!addBonus)}
				/>
				<label htmlFor="BonusCheckbox"></label>
				<p className="m-0">{t("Bonuses")}: {addBonus ? t("On") : t("Off")}</p>
			</div>
			<div className={styles.info_message}>
				<p className="m-0">{addBonus ? t("bonuses will spawn randomly") : " "}</p>
			</div>

			<div className={styles.gameform_checkbox_container}>
				<input 
					id="PrivateCheckbox" 
					type="checkbox" 
					checked={!isPrivate}
					onChange={() => setIsPrivate(!isPrivate)}
				/>
				<label htmlFor="PrivateCheckbox"></label>
				<p className="m-0">{t("Room is")}: {isPrivate ? t("Private") : t("Public")}</p>
			</div>
			<div className={styles.info_message}>
				<p className="m-0">{isPrivate ? " " : t("random users will be able to join")}</p>
			</div>

			<div className={styles.gameform_checkbox_container}>
				<input 
					id="timeLimitCheckBox" 
					type="checkbox" 
					checked={hasTimeLimit}
					onChange={() => setHasTimeLimit(!hasTimeLimit)}
				/>
				<label htmlFor="timeLimitCheckBox"></label>
				<p className="m-0">{t("Time limit")}: {hasTimeLimit ? "" : t("disabled")}</p>
				{hasTimeLimit && (
					<div className={styles.gameform_number_container}>
						<button onClick={() => setMaxTime(Math.min(15, maxTime + 1))}>+</button>
						<p className="m-0">{maxTime}m</p>
						<button onClick={() => setMaxTime(Math.max(1, maxTime - 1))}>-</button>
					</div>
				)}
			</div>
			
			<div className={styles.gameform_number_container} style={{margin: '16px', marginLeft: '23px', justifyContent: 'left'}}>
				<p className="m-0">{t("Point limit")}: </p>
				<button onClick={() => setMaxPoint(Math.min(15, maxPoint + 1))}>+</button>
				<p className="m-0">{maxPoint}</p>
				<button onClick={() => setMaxPoint(Math.max(1, maxPoint - 1))}>-</button>
			</div>

			<div className={styles.start_button}>
				<button onClick={handleSubmit}>
					{invitedUser ? t("INVITE") + invitedUser : t('START GAME')}
				</button>
			</div>
		</div>
	)
}

export default CustomGameForm;