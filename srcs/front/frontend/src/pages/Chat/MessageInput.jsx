import React, { useState } from 'react';
import './index.css'

const MessageInput = ({ onSendMessage }) => {
	const [message, setMessage] = useState('');

	const handleSend = () => {
		if (message.trim()) {
			onSendMessage(message);
			setMessage('');
		}
	};

	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			handleSend();
		}
	};

	return (
		<div>
			<input
				type="text"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Type your message here"
			/>
			<button onClick={handleSend}>Send</button>
		</div>
	);
};

export default MessageInput;
