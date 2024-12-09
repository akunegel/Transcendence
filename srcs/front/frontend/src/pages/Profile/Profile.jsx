import styles from "./Profil.module.css"
import { useState, useEffect, useContext } from 'react';
import {useNavigate} from "react-router-dom";
import AuthContext from "../../context/AuthContext.jsx";

const Profile =  () => {
	let [notes, setNotes] = useState([]);
	let {authTokens, logoutUser} = useContext(AuthContext);
	const navigate = useNavigate();

	const handleReturn = () => {
		navigate("/home");
	}

	useEffect(() => {
		getNotes()
	}, [])

	let getNotes = async () => {
		let response = await fetch(`${import.meta.env.VITE_API_URL}/users/notes/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + String(authTokens.access)
			}
		})
		let data = await response.json()
		if (response.status === 200) {
			setNotes(data)
		} else if (response.status === 'Unauthorized') {
			logoutUser()
		}
	}
	return (
		<div className={styles.centered_container}>
			<img
				src="../../assets/logo_profil.png"
				alt="Logo"
				className="logo"
			/>
			<div className={styles.userinfo_container}>
				<img
					className={styles.logo}
					src="../../assets/logo_profil.png"
					alt="Photo de profil"
				/>
				<p><strong>Username:</strong> username</p>
				<p><strong>First Name:</strong> fname</p>
				<p><strong>Last Name:</strong> lname</p>
				<p><strong>Email:</strong> email</p>
				<p><strong>Password:</strong> ********</p>
				<button>Edit profile</button>
			</div>
			<button onClick={handleReturn}>RETURN</button>
			<ul>
				{notes.map(note => (
					<li key={note.id}>{note.body}</li>
				))}
			</ul>
		</div>
	);
}

export default Profile;