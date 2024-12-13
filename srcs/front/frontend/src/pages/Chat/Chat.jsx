import { useState, useEffect } from 'react';
import MessageList from './MessageList.jsx';
import logo from "../../assets/images/logo_chat_box.png"
import styles from "./Chat.module.css"

function Chat() {

	const [messagesList, setMessagesList] = useState([]);
	const [ws, setWs] = useState(null);
	const [message, setMessage] = useState('');

	useEffect(() => {
		const connectWebSocket = () => {
			const socket = new WebSocket(`wss://${window.location.host}/ws/chat/`);
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
		<div className={styles.image_move_up}>
			<div className={styles.centered_container}>
				<div className={styles.message_container}>
					<MessageList messagesList={messagesList}/>
				</div>
				<div className={styles.input_container}>
					<input className="m-0" type="text" value={message} onChange={(e) => setMessage(e.target.value.substring(0, 108))} onKeyDown={handleKeyDown} placeholder="Type your message here" />
					<button className="m-0" onClick={sendMessage}>SEND</button>
				</div>
			</div>
			<img src={logo} alt="CHATBOX"/>
		</div>
	);
}

export default Chat;
