import { useState, useContext } from "react";
import AuthContext from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom"
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
                        message: `Click here to join ${user.username}'s game!`,
                        game_invite: {
                            room_id: room_id,
                            inviter: user.username
                        }
                    }));
                }
                
                navigate(`/play/${room_id}/`);
                
                if (invitedUser && ws && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({
						username: user.username,
						message: `Click here to join ${user.username}'s game!`,
						target_user: invitedUser,
						game_invite: {
							room_id: room_id,
							inviter: user.username
						}
					}));
				}
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
                    <p>Inviting: {invitedUser}</p>
                    <button onClick={onClose}>Cancel</button>
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
                <p className="m-0">Bonuses: {addBonus ? "On" : "Off"}</p>
            </div>

            <div className={styles.gameform_checkbox_container}>
                <input 
                    id="PrivateCheckbox" 
                    type="checkbox" 
                    checked={isPrivate}
                    onChange={() => setIsPrivate(!isPrivate)}
                />
                <label htmlFor="PrivateCheckbox"></label>
                <p className="m-0">Room is: {isPrivate ? "Private" : "Public"}</p>
            </div>

            <div className={styles.gameform_checkbox_container}>
                <input 
                    id="timeLimitCheckBox" 
                    type="checkbox" 
                    checked={hasTimeLimit}
                    onChange={() => setHasTimeLimit(!hasTimeLimit)}
                />
                <label htmlFor="timeLimitCheckBox"></label>
                <p className="m-0">Time limit: {hasTimeLimit ? "" : "disabled"}</p>
                {hasTimeLimit && (
                    <div className={styles.gameform_number_container}>
                        <button onClick={() => setMaxTime(Math.min(15, maxTime + 1))}>+</button>
                        <p className="m-0">{maxTime}m</p>
                        <button onClick={() => setMaxTime(Math.max(1, maxTime - 1))}>-</button>
                    </div>
                )}
            </div>
            
            <div className={styles.gameform_number_container} style={{margin: '16px', marginLeft: '23px', justifyContent: 'left'}}>
                <p className="m-0">Point limit: </p>
                <button onClick={() => setMaxPoint(Math.min(15, maxPoint + 1))}>+</button>
                <p className="m-0">{maxPoint}</p>
                <button onClick={() => setMaxPoint(Math.max(1, maxPoint - 1))}>-</button>
            </div>

            <div className={styles.start_button}>
                <button onClick={handleSubmit}>
                    {invitedUser ? `INVITE ${invitedUser}` : 'START GAME'}
                </button>
            </div>
        </div>
    )
}

export default CustomGameForm;