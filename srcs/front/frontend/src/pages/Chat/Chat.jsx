import React, { useState, useEffect } from 'react';
import MessageList from './MessageList.jsx';
import logo from "../../assets/logo_chat_box.png"
import styles from "./Chat.module.css"
import api from "../../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";

function Chat() {

	const [messagesList, setMessagesList] = useState([]);
	const [ws, setWs] = useState(null);
	const [message, setMessage] = useState('');

	useEffect(() => {
		const connectWebSocket = () => {
			const socket = new WebSocket(`ws://${import.meta.env.VITE_IP}:8000/ws/chat/`);
			setWs(socket);
	
			socket.onopen = () => {
				console.log("WebSocket connection established");
			};
			socket.onmessage = (event) => {
				const newMessage = JSON.parse(event.data);
				setMessagesList((prevMessagesList) => [...prevMessagesList, newMessage]);
			};
			socket.onclose = () => {
				console.log("WebSocket connection closed");
			};
			socket.onerror = (error) => {
				console.error("WebSocket error", error);
			};
		};

		const timer = setTimeout(connectWebSocket, 500);
	
		return () => {
			clearTimeout(timer);
			if (ws)
				ws.close();
		};
	}, []);


	const sendMessage = () => {
		if (message.trim()) {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ content: message }));
			}
		}
		setMessage('');
	}

	const handleKeyDown = (event) => {
		if (event.key === 'Enter') {
			sendMessage();
		}
	};


	return (
		<div className={styles.centered_container}>
			<img src={logo} alt="CHATBOX"/>
			<div className={styles.message_container}>
				<MessageList messagesList={messagesList}/>
			</div>
			<div className={styles.input_container}>
				<input type="text" value={message} onChange={(e) => setMessage(e.target.value.substring(0, 108))} onKeyDown={handleKeyDown} placeholder="Type your message here" />
				<button onClick={sendMessage}>SEND</button>
			</div>
		</div>
	);
}

export default Chat;
