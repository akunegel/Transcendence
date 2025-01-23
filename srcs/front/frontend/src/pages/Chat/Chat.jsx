import { useState, useEffect, useContext } from 'react';
import MessageList from './MessageList';
import logo from "../../assets/images/logo_chat_box.png";
import styles from "./Chat.module.css";
import AuthContext from '../../context/AuthContext';

function Chat() {
    const [messagesList, setMessagesList] = useState([]);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [ws, setWs] = useState(null);
    const [message, setMessage] = useState('');
    const { user, authTokens } = useContext(AuthContext);

    // Fetch blocked users when component mounts
    useEffect(() => {
        const fetchBlockedUsers = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/users/blocked-users/`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + String(authTokens.access)
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setBlockedUsers(data.blocked_users);
                }
            } catch (error) {
                console.error('Error fetching blocked users', error);
            }
        };
        fetchBlockedUsers();
    }, []);

    useEffect(() => {
        const connectWebSocket = () => {
            const socket = new WebSocket(`wss://${window.location.host}/ws/chat/`);
            setWs(socket);

            socket.onopen = () => {
                console.log("WebSocket connection established");
            };
            socket.onmessage = (event) => {
                const newMessage = JSON.parse(event.data);
                // Add ALL messages, including your own
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
            if (ws) ws.close();
        };
    }, []);

    const handleBlockUser = (username) => {
        setBlockedUsers(prev => [...prev, username]);
        // Filter out messages from newly blocked user
        setMessagesList(prev => prev.filter(msg => msg.username !== username));
    };

    const sendMessage = () => {
        if (message.trim()) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    username: user.username,
                    message: message.trim()
                }));
            }
        }
        setMessage('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className={styles.image_move_up}>
            <div className={styles.centered_container}>
                <div className={styles.message_container}>
                    <MessageList
                        messagesList={messagesList}
                        blockedUsers={blockedUsers}
                        onBlockUser={handleBlockUser}
                    />
                </div>
                <div className={styles.input_container}>
                    <input
                        className="m-0"
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value.substring(0, 108))}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message here"
                    />
                    <button className="m-0" onClick={sendMessage}>SEND</button>
                </div>
            </div>
            <img src={logo} alt="CHATBOX"/>
        </div>
    );
}

export default Chat;