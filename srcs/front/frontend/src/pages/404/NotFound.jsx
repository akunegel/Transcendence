import styles from "./NotFound.module.css"
import {useNavigate, useLocation} from "react-router-dom"
import { useTranslation } from "react-i18next";

function NotFound() {

	const navigate = useNavigate();
	const { t } = useTranslation();

	const handleHome = () => {
		navigate("/home");
	}

	return (
		<div className={styles.main_container}>
			<div className={styles.content_notfound}>
				<h1>{t("404 Not Found")}</h1>
			</div>
			<button onClick={handleHome}>{t("HOME")}</button>
		</div>
	)
}

export default NotFound