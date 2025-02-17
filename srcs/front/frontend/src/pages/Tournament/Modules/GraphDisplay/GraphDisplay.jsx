import connexion_lost from '../../../../assets/images/connexion_lost.png'
import default_pic from '../../../../assets/images/default_profile_pic.png'
import red_cross from '../../../../assets/images/red_cross.png'
import crown from '../../../../assets/images/crown.png'
import ImgFallback from '../../../../components/ImgFallback';
import styles from './GraphDisplay.module.css'
import { useTranslation } from "react-i18next";

function HorizontalLine({color}) {
	return (
		<div className={styles.column_container}>
			<div className={styles.horizontal_line} style={{borderBottom: '3px solid ' + color}}/>
			<div className={styles.horizontal_line} style={{borderTop: '3px solid ' + color}}/>
		</div>
	);
}

function BigPlayerCard({ player }) {
	const	{ t } = useTranslation();

	return (
		<div className={styles.big_player_container}>
			<img src={crown} alt="winner's crown"/>
			<div className={styles.big_player_box}>
				{player.connected ? 
						<ImgFallback	src={player.img}
										alt="Profil Picture"
										fallback={default_pic}
										style={{borderColor: player.color}}/>
					:
						<img	src={connexion_lost}
								alt="Connexion Lost"
								style={{borderColor: player.color}}/>
				}
				<p className='m-0' style={{borderColor: player.color}}>{player.arena_name ? player.arena_name : t("connecting...")}</p>
			</div>
			<p className='m-0' style={{borderColor: player.color}}>{t("[ WINNER ]")}</p>
		</div>
	);
}

function PlayerLostCard({ player }) {
	const	{ t } = useTranslation();

	return (
		<>
			<div className={styles.player_lost}>
				<img src={red_cross} alt="Player Lost"/>
			</div>
				<div className={styles.player_box}>
					{player.connected ? 
						<ImgFallback	src={player.img}
										alt="Profil Picture"
										fallback={default_pic}
										style={{borderColor: player.color}}/>
						:
						<img	src={connexion_lost}
								alt="Connexion Lost"
								style={{borderColor: player.color}}/>
					}
					<p className='m-0' style={{borderColor: player.color}}>{player.arena_name ? player.arena_name : t("connecting...")}</p>
				</div>
		</>
	);
}

function PlayerCard({ player }) {
	const	{ t } = useTranslation();

	return (
		<div className={styles.player_box}>
			{player.connected ? 
				<ImgFallback	src={player.img}
								alt="Profil Picture"
								fallback={default_pic}
								style={{borderColor: player.color}}/>
			:
				<img	src={connexion_lost}
						alt="Connexion Lost"
						style={{borderColor: player.color}}/>
			}
			<p className='m-0' style={{borderColor: player.color}}>{player.arena_name ? player.arena_name : t("connecting...")}</p>
		</div>
	);
}

function MakeLeftListOf(players, res, round, prevLength) {

	const column = (
		<div className={styles.column_container}>
			{players.map((player, i) => (
				<div className={styles.column_container} key={player.id}>
					<div className={styles.row_container}>
						{/* Displaying the players in the tournament */}
						{prevLength > 1 && round > 0 && <HorizontalLine color={player.color}/>}
						{round < res.length && !(res[round].includes(player.id)) ?
							<PlayerLostCard player={player}/>
						:
							prevLength > 1 ? <PlayerCard player={player}/> : <BigPlayerCard player={player}/>
						}
						{prevLength != 1 && players.length == 1 && <HorizontalLine color={'white'}/>}
					</div>
					{i == 1 && <br/>}
				</div>
			))}
		</div>
	);

	if (round >= res.length)
		return (column) ;

	const winners = res.length > 0 ? players.filter(player => res[round].includes(player.id)) : null
	const next_column = MakeLeftListOf(winners, res, (round + 1), players.length);

	return (
		<>
			{column}
			{next_column}
		</>
	);
}

function MakeRightListOf(players, res, round, prevLength) {

	const column = (
		<div className={styles.column_container}>
			{players.map((player, i) => (
				<div className={styles.column_container} key={player.id}>
					<div className={styles.row_container}>
						{/* Displaying the players in the tournament */}
						{prevLength != 1 && players.length == 1 && <HorizontalLine color={'white'}/>}
						{round < res.length && !(res[round].includes(player.id)) ?
							<PlayerLostCard player={player}/>
						:
							prevLength > 1 ? <PlayerCard player={player}/> : <BigPlayerCard player={player}/>
						}
						{prevLength > 1 && round > 0 && <HorizontalLine color={player.color}/>}
					</div>
					{i == 1 && <br/>}
				</div>
			))}
		</div>
	);

	if (round >= res.length)
		return (column) ;

	const winners = players.filter(player => res[round].includes(player.id))
	const next_column = MakeRightListOf(winners, res, (round + 1), players.length);

	return (
		<>
			{next_column}
			{column}
		</>
	);
}


function GraphDisplay({ players, info, results, title }) {
	const	{ t } = useTranslation();

	if (players == null)
		return ( <p>{t("connecting...")}</p>);

	const mid = Math.ceil(players.length / 2); // Get the middle index
	const leftPlayers = players.slice(0, mid);
	const rightPlayers = players.slice(mid);
	const leftList = MakeLeftListOf(leftPlayers, results, 0, leftPlayers.length);
	const rightList = MakeRightListOf(rightPlayers, results, 0, rightPlayers.length);

	return (
		<div className={styles.column_container}>
			<h1>{title}</h1>
			<div className={styles.row_container}>
				{leftList}
				{(results.length == 0 || (results.length == 1 && info.max_player == 8)) && <div style={{width: '100px'}}/>}
				{rightList}
			</div>
		</div>
	);
}

export default GraphDisplay