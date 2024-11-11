import styles from "./Profil.module.css"
import api from "../../api";
import logo from "../../assets/logo_profil.png"
import { useState, useEffect } from "react";
import {useNavigate, useLocation} from "react-router-dom"


function Profil() {
	const [user, setUser] = useState([])
	const navigate = useNavigate();
	
	const getUser = async () => {
		const response = await api.get("/api/user/getUser/?zxc")
		return (response.data)
	}
	const inituser = async () => {
		const TMPuser = await getUser()
		setUser(TMPuser);
	}
	
	useEffect(() => {
		inituser();
		console.log("data", user);
	}, []);

	const handleReturn = () => {
		navigate("/home");
	}

	return (
		<div className={styles.centered_container}>
			<img className={styles.logo} src={logo}/>
			<div className={styles.userinfo_container}>
				<img src={user.profil_pic}/>
				<p>- {user.username} -</p>
			</div>
			<button onClick={() => handleReturn()}>RETURN</button>
		</div>
	);
}

export default Profil