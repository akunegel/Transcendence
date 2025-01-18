import React, { useEffect, useRef } from 'react';
import styles from './Chat.module.css';

const MessageList = ({ messagesList }) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesList]);

    return (
        <div className={styles.message_list}>
            {messagesList.map((msg, index) => (
                <div key={index} className={styles.message_row}>
                    <button 
                        className={styles.username_button}
                        onClick={() => {}}
                    >
                        {msg.username}
                    </button>
                    <span className={styles.message_separator}>: </span>
                    <span className={styles.message_content}>{msg.message}</span>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;