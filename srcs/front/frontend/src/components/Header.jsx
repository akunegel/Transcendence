import { useContext, useState, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Dropdown from 'react-bootstrap/Dropdown';

const Header = () => {
	const { authTokens, logoutUser } = useContext(AuthContext);
	const [userLanguage, setLanguage] = useState({
		language: ''
	});

	useEffect(() => {
        if (authTokens) {
            getPlayerLanguage()
        }
    }, [authTokens])

	function handleLanguageChange(event){
		setLanguage({ language: event });
	}

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
				setLanguage({language: data.language});
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
									<Link className="nav-link" to="/home"><i className="bi bi-house me-1"></i> Home</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/profile"><i className="bi bi-person me-1"></i> Profile</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/lobby"><i className="bi bi-list-task me-1"></i> Lobby</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/local"><i className="bi bi-geo-alt me-1"></i> Local</Link>
								</li>
							</>
						)}
					</ul>
					<ul className="navbar-nav">
						{authTokens ? (
							<>
								<Dropdown>
                                    <Dropdown.Toggle variant="dark" id="dropdown-basic">
                                        {userLanguage.language || 'Loading...'}
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
										<i className="bi bi-people me-1"></i> Friends
									</Link>
								</li>
								<li className="nav-item">
									<button onClick={logoutUser} className="btn btn-link nav-link">
										<i className="bi bi-box-arrow-right me-1"></i> Logout
									</button>
								</li>
							</>
						) : (
							<>
								<li className="nav-item">
									<Link className="nav-link" to="/register"><i className="bi bi-pencil me-1"></i> Register</Link>
								</li>
								<li className="nav-item">
									<Link className="nav-link" to="/login"><i className="bi bi-box-arrow-in-right me-1"></i> Login</Link>
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