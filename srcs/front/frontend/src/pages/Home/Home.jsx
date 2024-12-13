import "../../styles/Home.css"
import styles from "./Home.module.css"
import logo from "../../assets/images/logo_shadowed.png"
import sublogo from "../../assets/images/logo_under.png"
import {useNavigate} from "react-router-dom"
import CutePong from "../MicroPong/MicroPong.jsx"
import Chat from "../Chat/Chat.jsx"
import {useContext} from "react";
import AuthContext from "../../context/AuthContext.jsx";

function Home() {
	let { logoutUser } = useContext(AuthContext);

	const navigate = useNavigate();
	
	const handleLocal = () => {
		navigate("/local")
	}
	
	const handleProfil = () => {
		navigate("/profile")
	}

	const handleOnline = () => {
		navigate("/lobby")
	}

	const handleLogout = () => {
		logoutUser()
	}

	return (
		<div>
			<div className={styles.logo_container}>
				<img className={styles.up_logo} src={logo} alt="TRANSCENDENCE"/>
				<br/>
				<img className={styles.sub_logo} src={sublogo} />
			</div>

			<div className={styles.main_container}>

				<div className={styles.centered_container}>
					<CutePong/>
					<button onClick={() => handleLocal()}>PLAY LOCAL</button>
				</div>

				<div className={styles.centered_container}>
					<button onClick={() => handleOnline()}>PLAY ONLINE</button>
					<button onClick={() => handleProfil()}>PROFILE</button>
					<button>SETTINGS</button>
					<button onClick={() => handleLogout()}>LOGOUT</button>
					<br/>
				</div>
				
				<div className={styles.centered_container_chat}>
					<Chat/>
				</div>

			</div>
		</div>
    );
}

export default Home