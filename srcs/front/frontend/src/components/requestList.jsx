
export const getRoomInfo = async (authTokens, roomId) => {

	try {
		const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/retrieveRoomInfo/${roomId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + String(authTokens.access)
			}
		})
		const data = await res.json();
		if (res.ok)
			return (data);
		else
			console.error(JSON.stringify(data));
	}
	catch (error) {
		console.error('Fetching room info error:', error)
	}
}

export const getTournamentInfo = async (authTokens, tourId) => {

	try {
		const res = await fetch(`${import.meta.env.VITE_API_URL}/pong/retrieveTournamentInfo/${tourId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + String(authTokens.access)
			}
		})
		const data = await res.json();
		if (res.ok)
			return (data);
		else
			console.error(JSON.stringify(data));
	}
	catch (error) {
		console.error('Fetching tournament info error:', error)
	}
}

export const getUser = async (authTokens) => {
	
	try {
		let response = await fetch(`${import.meta.env.VITE_API_URL}/users/profile/`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + String(authTokens.access)
			}
		})
		let data = await response.json()
		if (response.status === 200)
			return (data);
		else if (response.status === 401)
			return (null);

	} catch (error) {
		console.error('Failed to fetch profile', error)
		return (null)
	}
	return (null);
}
