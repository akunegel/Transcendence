import React, {useEffect, useRef, useState, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Chat.module.css';
import AuthContext from "../../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";

const MessageList = ({ 
    messagesList, 
    blockedUsers, 
    onBlockUser, 
    onGameInviteClick,
    onInviteUser 
}) => {
    const messagesEndRef = useRef(null);
    const [visibleMenu, setVisibleMenu] = useState({}); 
    const navigate = useNavigate();
    const { user, authTokens } = useContext(AuthContext);
	const { t } = useTranslation();

    const handleUsernameClick = (username, index) => {
        setVisibleMenu((prev) => ({
            ...prev,
            [index]: prev[index] ? null : username,
        }));
    };

    const handleOptionClick = async (option, username) => {
        if (option === 'View Profile') {
            navigate(`/other-profile/${username}`);
        } else if (option === 'Block') {
            try {
                let response = await fetch(`${import.meta.env.VITE_API_URL}/users/block-user/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + String(authTokens.access),
                    },
                    body: JSON.stringify({ username }),
                });

                let data = await response.json();
                if (response.ok) {
                    onBlockUser(username);
                    setVisibleMenu((prev) => {
                        const updatedMenu = { ...prev };
                        Object.keys(updatedMenu).forEach((key) => {
                            if (updatedMenu[key] === username) {
                                updatedMenu[key] = null;
                            }
                        });
                        return updatedMenu;
                    });
                } else {
                    console.error('Error blocking user', data);
                }
            } catch (error) {
                console.error('Error blocking user', error);
            }
        } else if (option === 'Invite') {
            setVisibleMenu((prev) => {
                const updatedMenu = { ...prev };
                Object.keys(updatedMenu).forEach((key) => {
                    if (updatedMenu[key] === username) {
                        updatedMenu[key] = null;
                    }
                });
                return updatedMenu;
            });
            onInviteUser(username);
        } else {
            // console.log(`${option} selected for ${username}`);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesList]);

    const filteredMessages = messagesList.filter(
        (msg) => !blockedUsers.includes(msg.username)
    );

    return (
        <div className={styles.message_list}>
            {filteredMessages.map((msg, index) => {
                const isValidMessage = !msg.target_user || msg.target_user === user.username;
                
                return isValidMessage ? (
                    <div key={index} className={styles.message_row}>
                        {!msg.message.startsWith("Click here to play against") && (
                            <button
                                className={styles.username_button}
                                onClick={() => handleUsernameClick(msg.username, index)}
                            >
                                {msg.username}
                            </button>
                        )}
                        {!msg.message.startsWith("Click here to play against") && (
                            <span className={styles.message_separator}>: </span>
                        )}
                        {visibleMenu[index] === msg.username && msg.username !== user.username && (
                            <div className={styles.menu}>
                                <button onClick={() => handleOptionClick('Block', msg.username)}>
                                    {t("Block")}
                                </button>
                                <button onClick={() => handleOptionClick('Invite', msg.username)}>
                                    {t("Invite")}
                                </button>
                                <button onClick={() => handleOptionClick('View Profile', msg.username)}>
                                    {t("View Profile")}
                                </button>
                            </div>
                        )}
                        <span className={styles.message_content}>
                        {msg.game_invite ? (
                            <button 
                                onClick={() => onGameInviteClick(msg.game_invite.room_id)}
                                className={styles.game_invite_button}
                            >
                                {msg.message}
                            </button>
                        ) : (
                            !msg.message.startsWith("Click here to join") && msg.message
                        )}
                        </span>
                    </div>
                ) : null;
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;