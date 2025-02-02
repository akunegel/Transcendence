import styles from './PlayersList.module.css'

function PlayersList({ players, info }) {

	const titleConnecting = 'Waiting for others to connect...';
	const titleStarting = '[Waiting for leader to start]';

	const list = players.map((player) => 
		<div className={styles.player_box} key={player.id}>
			<img src={player.img} style={{borderColor: player.color}} alt="Profil Picture"/>
			<p className='m-0' style={{borderColor: player.color}}>{player.arena_name}</p>
			{player.id == 1 &&
				<p className='m-0' style={{borderColor: player.color}}>leader</p>
			}
		</div>
	);

	return (
		<div className={styles.centered_container}>
			{players.length == info.max_player ? 
				<h1>{titleStarting}</h1>
			:
				<h1>{titleConnecting}</h1>
			}
			<h2>{players.length}/{info.max_player}</h2>
			<div className={styles.box}>
				{list}
			</div>
		</div>
	);

}

export default PlayersList