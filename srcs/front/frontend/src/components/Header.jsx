import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Dropdown from 'react-bootstrap/Dropdown';
import Connect42 from "./api42.jsx";
import logo from "../assets/images/42img.png";
import { useTranslation } from 'react-i18next'

const Header = () => {
	const { authTokens, logoutUser } = useContext(AuthContext);
	const { t, i18n } = useTranslation();
	const [userLanguage, setLanguage] = useState(null);
	const languageMap = {
		English: 'en',
		Français: 'fr',
		Español: 'es',
	};

	const handleConnect = () => {
		const clientId = `${import.meta.env.VITE_42_KEY}`;
		const redirectUri = `https://localhost:9443/42connect`;
		const url = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;

		window.location.href = url; // Redirect to 42 OAuth URL
	};

	useEffect(() => {
		if (authTokens) {
			getPlayerLanguage()
		}
	}, [authTokens])

	const handleLanguageChange = async (language) => {
		
		if (userLanguage == language)
			return;

		try {
			setLanguage(language);
			i18n.changeLanguage(languageMap[language]); // Set language globally in i18next

			await fetch(`${import.meta.env.VITE_API_URL}/users/language/`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + String(authTokens.access),
				},
				body: JSON.stringify({ language }),
			});
		} catch (error) {
			console.error('Failed to update language preference:', error);
		}
	};

	let getPlayerLanguage = async () => {

		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/settings/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				}
			})

			let data = await response.json()

			if (response.status === 200) {
				const language = data.language;
				setLanguage(language);
				i18n.changeLanguage(languageMap[language]);
			} else if (response.status === 401) {
				logoutUser()
			}
		} catch (error) {
			console.error('Failed to fetch language', error)
			logoutUser()
		}
	}

	return (
		<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
			<div className="container-fluid">
				<button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse" id="navbarNav">
					<ul className="navbar-nav me-auto mb-2 mb-lg-0">
						{authTokens && (
							<>
								<li className="nav-item">
									<Link className="nav-link" to="/home"><i className="bi bi-house me-1"></i> {t("Home")}</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/profile"><i className="bi bi-person me-1"></i> {t("Profile")}</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/local"><i className="bi bi-geo-alt me-1"></i> {t("Local")}</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/lobby"><i className="bi bi-list-task me-1"></i> {t("Lobby")}</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/tournament"><i className="bi bi-list-task me-1"></i> {t("Tournament")}</Link>
								</li>
							</>
						)}
					</ul>
					<ul className="navbar-nav">
						{authTokens ? (
							<>
								<Dropdown>
									<Dropdown.Toggle variant="dark" id="dropdown-basic">
										{userLanguage ? userLanguage : 'Loading...'}
									</Dropdown.Toggle>

									<Dropdown.Menu>
										<Dropdown.Item onClick={() => handleLanguageChange('English')}>
											English
										</Dropdown.Item>
										<Dropdown.Item onClick={() => handleLanguageChange('Français')}>
											Français
										</Dropdown.Item>
										<Dropdown.Item onClick={() => handleLanguageChange('Español')}>
											Español
										</Dropdown.Item>
									</Dropdown.Menu>
								</Dropdown>
								<li className="nav-item">
									<Link className="nav-link" to="/friends">
										<i className="bi bi-people me-1"></i> {t("Friends")}
									</Link>
								</li>
								<li className="nav-item">
									<button onClick={logoutUser} className="btn btn-link nav-link">
										<i className="bi bi-box-arrow-right me-1"></i> {t("Logout")}
									</button>
								</li>
							</>
						) : (
							<>
								<li className="nav-item">
									<Link className="nav-link" to="/register"><i className="bi bi-pencil me-1"></i> {t("Register")}</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/login"><i className="bi bi-box-arrow-in-right me-1"></i> {t("Login")}</Link>
								</li>
								<li className="nav-item">
									<button className="nav-link" onClick={handleConnect}><img src={logo} alt="42" width="25" height="25" border="none"></img></button>
								</li>
							</>
						)}
					</ul>
				</div>
			</div>
		</nav>
	);
};

export default Header;