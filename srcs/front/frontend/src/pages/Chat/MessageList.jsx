import React, {useEffect, useRef, useState, useContext} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Chat.module.css';
import AuthContext from "../../context/AuthContext.jsx";

const MessageList = ({ messagesList, blockedUsers, onBlockUser }) => {
    const messagesEndRef = useRef(null);
    const [visibleMenu, setVisibleMenu] = useState({}); // Track visibility of menu per message
    const navigate = useNavigate();
    const { user, authTokens } = useContext(AuthContext);

    const handleUsernameClick = (username, index) => {
        setVisibleMenu((prev) => ({
            ...prev,
            [index]: prev[index] ? null : username, // Toggle visibility for this specific message
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
                        // Reset the menu visibility after blocking
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
        } else {
            console.log(`${option} selected for ${username}`);
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
            {filteredMessages.map((msg, index) => (
                <div key={index} className={styles.message_row}>
                    <button
                        className={styles.username_button}
                        onClick={() => handleUsernameClick(msg.username, index)}
                    >
                        {msg.username}
                    </button>
                    {visibleMenu[index] === msg.username && msg.username !== user.username && (
                        <div className={styles.menu}>
                            <button onClick={() => handleOptionClick('Block', msg.username)}>
                                Block
                            </button>
                            <button onClick={() => handleOptionClick('Invite', msg.username)}>
                                Invite
                            </button>
                            <button onClick={() => handleOptionClick('View Profile', msg.username)}>
                                View Profile
                            </button>
                        </div>
                    )}
                    <span className={styles.message_separator}>: </span>
                    <span className={styles.message_content}>{msg.message}</span>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};


export default MessageList;