'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import {
	PlayerData,
	PlayerPosition,
	PlayerRotation,
	MultiplayerState,
	ServerToClientEvents,
	ClientToServerEvents
} from '@/types/multiplayer'

interface MultiplayerContextType extends MultiplayerState {
	socket: Socket<ServerToClientEvents, ClientToServerEvents> | null
	joinRoom: (roomId: string, userData: { userId: string; username: string }) => void
	leaveRoom: () => void
	updatePlayerPosition: (position: PlayerPosition, rotation: PlayerRotation, isMoving: boolean) => void
	disconnect: () => void
}

const MultiplayerContext = createContext<MultiplayerContextType | null>(null)

interface MultiplayerProviderProps {
	children: ReactNode
	serverUrl?: string
}

export function MultiplayerProvider({ children, serverUrl = 'http://localhost:4000' }: MultiplayerProviderProps) {
	const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
	const [state, setState] = useState<MultiplayerState>({
		isConnected: false,
		currentRoom: null,
		currentPlayer: null,
		otherPlayers: new Map(),
		isJoining: false,
		error: null
	})

	// Initialize socket connection
	useEffect(() => {
		const socket = io(`${serverUrl}/multiplayer`, {
			autoConnect: false,
			transports: ['websocket', 'polling']
		})

		socketRef.current = socket

		// Connection events
		socket.on('connect', () => {
			console.log('Connected to multiplayer server')
			setState(prev => ({ ...prev, isConnected: true, error: null }))
		})

		socket.on('disconnect', () => {
			console.log('Disconnected from multiplayer server')
			setState(prev => ({
				...prev,
				isConnected: false,
				currentRoom: null,
				currentPlayer: null,
				otherPlayers: new Map()
			}))
		})

		socket.on('connect_error', (error) => {
			console.error('Connection error:', error)
			setState(prev => ({ ...prev, error: error.message, isConnected: false }))
		})

		// Room events
		socket.on('room-joined', (roomId, players) => {
			console.log(`Joined room ${roomId} with ${players.length} players`)
			
			const otherPlayersMap = new Map<string, PlayerData>()
			let currentPlayer: PlayerData | null = null

			players.forEach(player => {
				if (player.id === socket.id) {
					currentPlayer = player
				} else {
					otherPlayersMap.set(player.id, player)
				}
			})

			setState(prev => ({
				...prev,
				currentRoom: roomId,
				currentPlayer,
				otherPlayers: otherPlayersMap,
				isJoining: false,
				error: null
			}))
		})

		socket.on('player-joined', (player) => {
			console.log(`Player ${player.username} joined`)
			setState(prev => {
				const newOtherPlayers = new Map(prev.otherPlayers)
				newOtherPlayers.set(player.id, player)
				return { ...prev, otherPlayers: newOtherPlayers }
			})
		})

		socket.on('player-left', (playerId) => {
			console.log(`Player ${playerId} left`)
			setState(prev => {
				const newOtherPlayers = new Map(prev.otherPlayers)
				newOtherPlayers.delete(playerId)
				return { ...prev, otherPlayers: newOtherPlayers }
			})
		})

		socket.on('player-moved', (playerId, position, rotation, isMoving) => {
			setState(prev => {
				const newOtherPlayers = new Map(prev.otherPlayers)
				const player = newOtherPlayers.get(playerId)
				
				if (player) {
					newOtherPlayers.set(playerId, {
						...player,
						position,
						rotation,
						isMoving,
						lastUpdate: Date.now()
					})
				}
				
				return { ...prev, otherPlayers: newOtherPlayers }
			})
		})

		socket.on('error', (message) => {
			console.error('Socket error:', message)
			setState(prev => ({ ...prev, error: message }))
		})

		// Connect to server
		socket.connect()

		return () => {
			socket.disconnect()
		}
	}, [serverUrl])

	const joinRoom = (roomId: string, userData: { userId: string; username: string }) => {
		if (!socketRef.current?.connected) {
			setState(prev => ({ ...prev, error: 'Not connected to server' }))
			return
		}

		setState(prev => ({ ...prev, isJoining: true, error: null }))
		// Gửi dưới dạng object để backend có thể nhận đúng
		socketRef.current.emit('join-room', { roomId, userData })
	}

	const leaveRoom = () => {
		if (!socketRef.current?.connected) return

		socketRef.current.emit('leave-room')
		setState(prev => ({
			...prev,
			currentRoom: null,
			currentPlayer: null,
			otherPlayers: new Map()
		}))
	}

	const updatePlayerPosition = (position: PlayerPosition, rotation: PlayerRotation, isMoving: boolean) => {
		if (!socketRef.current?.connected || !state.currentRoom) return

		// Update local player state immediately for responsiveness
		setState(prev => {
			if (!prev.currentPlayer) return prev
			
			return {
				...prev,
				currentPlayer: {
					...prev.currentPlayer,
					position,
					rotation,
					isMoving,
					lastUpdate: Date.now()
				}
			}
		})

		// Send to server as object
		socketRef.current.emit('player-move', { position, rotation, isMoving })
	}

	const disconnect = () => {
		if (socketRef.current) {
			socketRef.current.disconnect()
		}
	}

	const contextValue: MultiplayerContextType = {
		...state,
		socket: socketRef.current,
		joinRoom,
		leaveRoom,
		updatePlayerPosition,
		disconnect
	}

	return (
		<MultiplayerContext.Provider value={contextValue}>
			{children}
		</MultiplayerContext.Provider>
	)
}

export function useMultiplayer() {
	const context = useContext(MultiplayerContext)
	if (!context) {
		throw new Error('useMultiplayer must be used within a MultiplayerProvider')
	}
	return context
}
