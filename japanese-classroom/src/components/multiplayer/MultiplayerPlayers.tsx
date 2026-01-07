'use client'

import { useMultiplayer } from '@/contexts/MultiplayerContext'
import { OtherPlayer } from './OtherPlayer'

export function MultiplayerPlayers() {
	const { otherPlayers } = useMultiplayer()

	return (
		<>
			{Array.from(otherPlayers.values()).map(player => (
				<OtherPlayer key={player.id} player={player} />
			))}
		</>
	)
}
