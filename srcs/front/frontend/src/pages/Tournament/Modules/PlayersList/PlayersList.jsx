import styles from './PlayersList.module.css'
import { useEffect, useState } from 'react'
import default_pic from '../../../../assets/images/default_profile_pic.png'
import ImgFallback from '../../../../components/ImgFallback';

function PlayersList({ isLeader, wsRef, players, info }) {

	const [allLogged, setAllLogged] = useState(false);

	useEffect(() => {
		// Is the room full ?
		if (players.length != info.max_player) {
			setAllLogged(false);
			return ;
		}
		// Does every player have an arena name ?
		for (const player of players) {
			if (!player.arena_name) {
				setAllLogged(false);
				return ;
			}
		}
		setAllLogged(true);
	}, [players]);

	const list = players.map((player) => 

		<div className={styles.player_box} key={player.id}>
			<ImgFallback	src={player.img}
							alt="Profil Picture"
							fallback={default_pic}
							style={{borderColor: player.color}}/>
			<p className='m-0' style={{borderColor: player.color}}>{player.arena_name ? player.arena_name : "connecting..."}</p>
			{player.id == 1 &&
				<p className='m-0' style={{borderColor: player.color}}>leader</p>
			}
		</div>
	);

	const startGame = () => {
		if (!allLogged || !isLeader)
			return ;
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
			wsRef.current.send(JSON.stringify({ start_game: 'start' }));
		return ;
	}

	return (
		<div className={styles.centered_container}>
			{players.length == info.max_player && allLogged ? 
				<h1>{isLeader ? '[ You can start the tournament ]' : '[ Waiting for leader to start ]'}</h1>
			:
				<h1>{'Waiting for others to connect...'}</h1>
			}
			<h2>{players.length}/{info.max_player}</h2>
			<div className={styles.box}>
				{list}
			</div>
			{isLeader &&
				<div className={styles.start_button}>
					{allLogged ?
						<button onClick={() => startGame()}>START</button>
						:
						<p>...</p>
					}
				</div>
			}
		</div>
	);

}

export default PlayersList