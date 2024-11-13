import React, { useState, useEffect } from 'react';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
// import './index.css'

const ChatRoom = () => {

	const [messages, setMessages] = useState([]);
	const [ws, setWs] = useState(null);

	useEffect(() => {
		const socket = new WebSocket('ws://localhost:8000/ws/chat/');
		setWs(socket);

		socket.onmessage = (event) => {
			const newMessage = JSON.parse(event.data);
			setMessages((prevMessages) => [...prevMessages, newMessage]);
		};

		return () => socket.close();
	}, []);

	const sendMessage = (messageContent) => {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ content: messageContent }));
		}
	}

	return (
		<div className="chat-container">
			<h2 className="chat-title">Live Chat Room</h2>
			<div className="chat-box">
				<MessageList messages={messages}/>
				<MessageInput onSendMessage={sendMessage}/>
			</div>
		</div>
	);
};

export default ChatRoom;
