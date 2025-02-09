import styles from './GraphDisplay.module.css'
import connexion_lost from '../../../../assets/images/connexion_lost.png'
import default_pic from '../../../../assets/images/default_profile_pic.png'
import ImgFallback from '../../../../components/ImgFallback';

function MakeLeftListOf( players ) {

	return (players.map((player) =>

		<div className={styles.row_container} key={player.id}>

			{/* Displaying the players in the tournament */}
			<div className={styles.player_box} key={player.id}>
				{player.connected ? 
					<ImgFallback	src={player.img}
									alt="Profil Picture"
									fallback={player.connected ? default_pic : connexion_lost}
									style={{borderColor: player.color}}/>
				:
					<img	src={connexion_lost}
							alt="Connexion Lost"
							style={{borderColor: player.color}}/>
				}
				<p className='m-0' style={{borderColor: player.color}}>{player.arena_name ? player.arena_name : "connecting..."}</p>
			</div>

			{/* Displaying the match tree's branches */}
			<div className={styles.column_container}>
				{player.id % 2 ?
					<>
						<div className={styles.line} style={{borderBottom: '5px solid white'}}/>
						<div className={styles.line} style={{borderRight: '5px solid white'}}/>
					</>
				:
					<>
						<div className={styles.line} style={{borderRight: '5px solid white'}}/>
						<div className={styles.line} style={{borderTop: '5px solid white'}}/>
					</>
				}
			</div>

		</div>
	));
}

function MakeRightListOf( players ) {

	return (players.map((player) =>

		<div className={styles.row_container} key={player.id}>

			{/* Displaying the match tree's branches */}
			<div className={styles.column_container}>
				{player.id % 2 ?
					<>
						<div className={styles.line} style={{borderBottom: '5px solid white'}}/>
						<div className={styles.line} style={{borderLeft: '5px solid white'}}/>
					</>
				:
					<>
						<div className={styles.line} style={{borderLeft: '5px solid white'}}/>
						<div className={styles.line} style={{borderTop: '5px solid white'}}/>
					</>
				}
			</div>

			{/* Displaying the players in the tournament */}
			<div className={styles.player_box}>
				{player.connected ? 
					<ImgFallback	src={player.img}
									alt="Profil Picture"
									fallback={player.connected ? default_pic : connexion_lost}
									style={{borderColor: player.color}}/>
				:
					<img	src={connexion_lost}
							alt="Connexion Lost"
							style={{borderColor: player.color}}/>
				}
				<p className='m-0' style={{borderColor: player.color}}>{player.arena_name ? player.arena_name : "connecting..."}</p>
			</div>

		</div>
	));
}


function GraphDisplay({ players, info, round, results, title }) {

	if (players == null)
		return ( <p>connecting...</p>);

	const mid = Math.ceil(players.length / 2); // Get the middle index
	const leftPlayers = players.slice(0, mid);
	const rightPlayers = players.slice(mid);
	const leftList = MakeLeftListOf(leftPlayers);
	const rightList = MakeRightListOf(rightPlayers);

	return (
		<div className={styles.column_container}>
			<h1>{title}</h1>
			<div className={styles.row_container}>
				<div className={styles.box}>
					{leftList}
				</div>
				<div className={styles.box} style={{width: '100px'}}/>
				<div className={styles.box}>
					{rightList}
				</div>
			</div>
		</div>
	);
}

export default GraphDisplay