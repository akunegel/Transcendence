import "../../styles/Home.css"
import styles from "./Home.module.css"
import logo from "../../assets/images/logo_shadowed.png"
import sublogo from "../../assets/images/logo_under.png"
import {useNavigate} from "react-router-dom"
import CutePong from "../MicroPong/MicroPong.jsx"
import Chat from "../Chat/Chat.jsx"
import {useContext} from "react";
import AuthContext from "../../context/AuthContext.jsx";
import { useTranslation } from "react-i18next";

function Home() {
	let { logoutUser } = useContext(AuthContext);
	const { t } = useTranslation();

	const navigate = useNavigate();
	
	const handleLocal = () => {
		navigate("/local")
	}
	
	const handleProfil = () => {
		navigate("/profile")
	}

	const handleSettings = () => {
		navigate("/settings")
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
					<button onClick={() => handleLocal()}>{t("PLAY LOCAL")}</button>
				</div>

				<div className={styles.centered_container}>
					<button onClick={() => handleOnline()}>{t("PLAY ONLINE")}</button>
					<button onClick={() => handleProfil()}>{t("PROFILE")}</button>
					<button onClick={() => handleSettings()}>{t("SETTINGS")}</button>
					<button onClick={() => handleLogout()}>{t("LOGOUT")}</button>
					<br/>
				</div>
				
				<div>
					<Chat/>
				</div>

			</div>
		</div>
    );
}

export default Home