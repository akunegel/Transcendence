import React, { useEffect, useRef } from 'react';
import './index.css'

const MessageList = ({ messages }) => {
	const messagesEndRef = useRef(null);

	// Défile automatiquement vers le bas lorsque les messages changent
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className="message-list">
			{messages.map((msg, index) => (
				<p key={index} className="message-bubble">{msg.content}</p>
			))}
			{/* Référence utilisée pour le scroll */}
			<div ref={messagesEndRef} />
		</div>
	);
};

export default MessageList;
