import { useState, useEffect, useContext } from 'react';
import AuthContext from '../../context/AuthContext';

const Friends = () => {
	const { authTokens } = useContext(AuthContext);
	const [searchUsername, setSearchUsername] = useState('');
	const [friends, setFriends] = useState([]);
	const [friendRequests, setFriendRequests] = useState([]);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchFriendsAndRequests = async () => {
			try {
				let friendsResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + String(authTokens.access)
					}
				});

				let requestsResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/requests/`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + String(authTokens.access)
					}
				});

				if (!friendsResponse.ok || !requestsResponse.ok) {
					throw new Error('Failed to fetch friends or requests');
				}

				const friendsData = await friendsResponse.json();
				const requestsData = await requestsResponse.json();

				setFriends(friendsData);
				setFriendRequests(requestsData);
			} catch (error) {
				console.error('Error fetching friends and requests:', error);
				setError(error.message);
			}
		};

		fetchFriendsAndRequests();
	}, [authTokens]);

	const sendFriendRequest = async () => {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/send-request/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				},
				body: JSON.stringify({ username: searchUsername })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.detail || 'Failed to send friend request');
			}

			alert('Friend request sent!');
			setSearchUsername('');
		} catch (error) {
			console.error('Error sending friend request:', error);
			alert(error.message);
		}
	};

	const acceptFriendRequest = async (requestId) => {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/accept-request/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				},
				body: JSON.stringify({ request_id: requestId })
			});

			if (!response.ok) {
				throw new Error('Failed to accept friend request');
			}

			setFriendRequests(prevRequests =>
				prevRequests.filter(req => req.id !== requestId)
			);

			let friendsResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				}
			});

			if (friendsResponse.ok) {
				const friendsData = await friendsResponse.json();
				setFriends(friendsData);
			}
		} catch (error) {
			console.error('Error accepting friend request:', error);
		}
	};

	const removeFriend = async (friendId) => {
		try {
			let response = await fetch(`${import.meta.env.VITE_API_URL}/users/friends/remove/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + String(authTokens.access)
				},
				body: JSON.stringify({ friend_id: friendId })
			});

			if (!response.ok) {
				throw new Error('Failed to remove friend');
			}

			setFriends(prevFriends =>
				prevFriends.filter(friend => friend.id !== friendId)
			);
		} catch (error) {
			console.error('Error removing friend:', error);
		}
	};

	return (
		<div className="container mt-4">
			<h1>Friends</h1>

			{error && (
				<div className="alert alert-danger" role="alert">
					{error}
				</div>
			)}

			<div className="card mb-4">
				<div className="card-header">Friend Requests</div>
				<div className="card-body">
					{friendRequests.length === 0 ? (
						<p>No pending friend requests</p>
					) : (
						friendRequests.map(request => (
							<div key={request.id} className="d-flex justify-content-between align-items-center mb-2">
								<span>{request.sender.username}</span>
								<button
									className="btn btn-primary btn-sm"
									onClick={() => acceptFriendRequest(request.id)}
								>
									Accept
								</button>
							</div>
						))
					)}
				</div>
			</div>

			<div className="card mb-4">
				<div className="card-header">Add Friend</div>
				<div className="card-body">
					<div className="input-group">
						<input
							type="text"
							className="form-control"
							placeholder="Enter username"
							value={searchUsername}
							onChange={(e) => setSearchUsername(e.target.value)}
						/>
						<button
							className="btn btn-primary"
							onClick={sendFriendRequest}
						>
							Send Request
						</button>
					</div>
				</div>
			</div>

			<div className="card">
				<div className="card-header">My Friends</div>
				<div className="card-body">
					{friends.length === 0 ? (
						<p>You have no friends yet</p>
					) : (
						friends.map(friend => (
							<div
								key={friend.id}
								className="d-flex justify-content-between align-items-center mb-2"
							>
								<span>{friend.username}</span>
								<button
									className="btn btn-danger btn-sm"
									onClick={() => removeFriend(friend.id)}
								>
									Remove
								</button>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

export default Friends;