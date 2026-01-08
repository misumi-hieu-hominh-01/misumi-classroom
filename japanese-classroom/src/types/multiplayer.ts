export interface PlayerPosition {
	x: number
	y: number
	z: number
}

export interface PlayerRotation {
	x: number
	y: number
	z: number
}

export interface PlayerData {
	id: string
	userId: string
	username: string
	position: PlayerPosition
	rotation: PlayerRotation
	isMoving: boolean
	lastUpdate: number
}

// Socket Events
export interface ServerToClientEvents {
	'player-joined': (player: PlayerData) => void
	'player-left': (playerId: string) => void
	'player-moved': (playerId: string, position: PlayerPosition, rotation: PlayerRotation, isMoving: boolean) => void
	'players-list': (players: PlayerData[]) => void
	'room-joined': (roomId: string, players: PlayerData[]) => void
	'pong': () => void // Response to ping for latency measurement
	error: (message: string) => void
}

export interface ClientToServerEvents {
	'join-room': (data: { roomId: string; userData: { userId: string; username: string } }) => void
	'leave-room': () => void
	'player-move': (data: { position: PlayerPosition; rotation: PlayerRotation; isMoving: boolean }) => void
	'ping': () => void // Ping request for latency measurement
}

export interface MultiplayerState {
	isConnected: boolean
	currentRoom: string | null
	currentPlayer: PlayerData | null
	otherPlayers: Map<string, PlayerData>
	isJoining: boolean
	error: string | null
}
