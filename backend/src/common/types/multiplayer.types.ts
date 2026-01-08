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

export interface RoomData {
	id: string
	players: Map<string, PlayerData>
	createdAt: Date
	lastActivity: Date
}

// Socket Events
export interface ServerToClientEvents {
	'player-joined': (player: PlayerData) => void
	'player-left': (playerId: string) => void
	'player-moved': (playerId: string, position: PlayerPosition, rotation: PlayerRotation, isMoving: boolean) => void
	'players-list': (players: PlayerData[]) => void
	'room-joined': (roomId: string, players: PlayerData[]) => void
}

export interface ClientToServerEvents {
	'join-room': (data: { roomId: string; userData: { userId: string; username: string } }) => void
	'leave-room': () => void
	'player-move': (data: { position: PlayerPosition; rotation: PlayerRotation; isMoving: boolean }) => void
}

export interface InterServerEvents {
	ping: () => void
}

export interface SocketData {
	playerId?: string
	userId?: string
	username?: string
	roomId?: string
}
