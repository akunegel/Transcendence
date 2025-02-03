import styles from './GraphDisplay.module.css'
import connexion_lost from '../../../../assets/images/connexion_lost.png'

function GraphDisplay({ players, info }) {

	const list = players == null ? <p>connecting...</p> : players.map((player) =>

		<div className={styles.player_box} key={player.id}>
			<img	src={player.connected ? player.img : connexion_lost}
					style={{borderColor: player.color}} alt="Profil Picture"/>
			<p className='m-0' style={{borderColor: player.color}}>{player.arena_name ? player.arena_name : "connecting..."}</p>
		</div>
	);


	return (
		<div className={styles.graph_container}>
			<div className={styles.box}>
				{list}
			</div>
		</div>
	);
}

export default GraphDisplay