import styles from "./NotFound.module.css"
import {useNavigate, useLocation} from "react-router-dom"

function NotFound() {

	const navigate = useNavigate();

	const handleHome = () => {
		navigate("/home");
	}

	return (
		<div className={styles.main_container}>
			<div className={styles.content_notfound}>
				<h1>404 Not Found</h1>
			</div>
			<button onClick={handleHome}>HOME</button>
		</div>
	)
}

export default NotFound