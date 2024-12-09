import { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import { Link } from 'react-router-dom'

const Header = () => {
	let {user, logoutUser} = useContext(AuthContext)
	return (
		<div>
			{user ? (<button onClick={logoutUser} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>) : (<Link to="/login">Login</Link>)}
			<span> | </span>
			<Link to="/register">Register</Link>
			<span> | </span>
			<Link to="/home">Home</Link>
			<span> | </span>
			<Link to="/profile">Profile</Link>
			<span> | </span>
			<Link to="/Lobby">Lobby</Link>
			<span> | </span>
			<Link to="/play">Play</Link>
			<span> | </span>
			<Link to="/local">Local</Link>
			{user && <p>Hello {user.username}</p>}
		</div>
	)
}

export default Header