import styles from './PlayersList.module.css'

function PlayersList({ players }) {

	const list = players.map((player) => 
		<div className={styles.player_box} key={player.id}>
			<p>player {player.id}:</p>
			<img src={player.img} alt="Profil Picture"/>
			<p>{player.arena_name}</p>
		</div>
	);

	return (
		<div className={styles.box}>
			{list}
		</div>
	);

}

export default PlayersList