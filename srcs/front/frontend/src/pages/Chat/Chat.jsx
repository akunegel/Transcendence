import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MessageList from './MessageList';
import logo from "../../assets/images/logo_chat_box.png";
import styles from "./Chat.module.css";
import AuthContext from '../../context/AuthContext';

function CustomGameForm({ invitedUser = null, onClose = () => {}, ws = null }) {
    const navigate = useNavigate();
	const location = useLocation();
    const { user, authTokens } = useContext(AuthContext);
    const [addBonus, setAddBonus] = useState(false);
    const [isPrivate, setIsPrivate] = useState(true);
    const [hasTimeLimit, setHasTimeLimit] = useState(false);
    const [maxTime, setMaxTime] = useState(5);
    const [maxPoint, setMaxPoint] = useState(5);

	useEffect(() => {
		return () => {
			// Close WebSocket when the component unmounts or the URL changes
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [location.pathname]); // Runs when the URL path changes

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

function Chat() {
    const [messagesList, setMessagesList] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [ws, setWs] = useState(null);
    const [message, setMessage] = useState('');
    const [openCustomGame, setOpenCustomGame] = useState(null);
    const navigate = useNavigate();
    const { user, authTokens } = useContext(AuthContext);

    useEffect(() => {
        const fetchBlockedUsers = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/users/blocked-users/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + String(authTokens.access)
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setBlockedUsers(data.blocked_users);
                }
            } catch (error) {
                console.error('Error fetching blocked users', error);
            }
        };
        fetchBlockedUsers();
    }, []);

    useEffect(() => {
        const connectWebSocket = () => {
            const socket = new WebSocket(`wss://${window.location.host}/ws/chat/`);
            setWs(socket);

            socket.onmessage = (event) => {
                const newMessage = JSON.parse(event.data);
                if (!newMessage.target_user || newMessage.target_user === user.username) {
                    setMessagesList((prevMessagesList) => [...prevMessagesList, newMessage]);
                }
            };
            socket.onerror = (error) => {
                console.error("WebSocket error", error);
            };
        };

        const timer = setTimeout(connectWebSocket, 500);

        return () => {
            clearTimeout(timer);
            if (ws) ws.close();
        };
    }, []);

    const handleBlockUser = (username) => {
        setBlockedUsers(prev => [...prev, username]);
        setMessagesList(prev => prev.filter(msg => msg.username !== username));
    };

    const handleGameInviteClick = (roomId) => {
        navigate(`/play/${roomId}/`);
    };

    const sendMessage = () => {
        if (message.trim() && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                username: user.username,
                message: message.trim()
            }));
            setMessage('');
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    const handleInviteUser = (username) => {
        setOpenCustomGame(username);
    };

    return (
        <div className={styles.image_move_up}>
            {!openCustomGame && (
                <div className={styles.centered_container_chat}>
                    <div className={styles.message_container}>
                        <MessageList
                            messagesList={messagesList}
                            blockedUsers={blockedUsers}
                            onBlockUser={handleBlockUser}
                            onGameInviteClick={handleGameInviteClick}
                            onInviteUser={handleInviteUser}
                        />
                    </div>
                    <div className={styles.input_container}>
                        <input
                            className="m-0"
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value.substring(0, 108))}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message here"
                        />
                        <button className="m-0" onClick={sendMessage}>SEND</button>
                    </div>
                </div>
            )}
            {openCustomGame && (
                <div className={styles.custom_game_overlay}>
                    <CustomGameForm className={styles.custom_game_form}
                        invitedUser={openCustomGame}
                        onClose={() => setOpenCustomGame(null)}
                        ws={ws}
                    />
                </div>
            )}
            <img src={logo} alt="CHATBOX"/>
        </div>
    );
}

export default Chat;