import React, { useEffect, useRef } from 'react';
import styles from './Chat.module.css'

const MessageList = ({ messagesList }) => {
	const messagesEndRef = useRef(null);

	// Défile automatiquement vers le bas lorsque les messages changent
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messagesList]);

	return (
		<div className={styles.message_list}>
			{messagesList.map((msg, index) => (
				<p key={index}>{msg.content}</p>
			))}
			{/* Référence utilisée pour le scroll */}
			<div ref={messagesEndRef} />
		</div>
	);
};

export default MessageList;
