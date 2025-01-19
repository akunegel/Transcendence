import React, {useEffect, useRef, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Chat.module.css';

const MessageList = ({ messagesList }) => {
    const messagesEndRef = useRef(null);
    const [menuVisible, setMenuVisible] = useState(null);
    const navigate = useNavigate();

    const handleUsernameClick = (username) => {
        setMenuVisible((prev) => (prev === username ? null : username));
    };

    const handleOptionClick = (option, username) => {
        if (option === 'View Profile') {
            navigate(`/other-profile/${username}`);
        } else {
            console.log(`${option} selected for ${username}`);
        }
        setMenuVisible(null);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesList]);

    return (
        <div className={styles.message_list}>
            {messagesList.map((msg, index) => (
                <div key={index} className={styles.message_row}>
                    <button
                        className={styles.username_button}
                        onClick={() => handleUsernameClick(msg.username)}
                    >
                        {msg.username}
                    </button>
                    {menuVisible === msg.username && (
                        <div className={styles.menu}>
                            <button onClick={() => handleOptionClick('Block', msg.username)}>Block</button>
                            <button onClick={() => handleOptionClick('Invite', msg.username)}>Invite</button>
                            <button onClick={() => handleOptionClick('View Profile', msg.username)}>View Profile</button>
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