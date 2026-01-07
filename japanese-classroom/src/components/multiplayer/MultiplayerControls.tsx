'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/react'
import { Input } from '@nextui-org/react'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { Chip } from '@nextui-org/react'
import { useMultiplayer } from '@/contexts/MultiplayerContext'

export function MultiplayerControls() {
	const {
		isConnected,
		currentRoom,
		currentPlayer,
		otherPlayers,
		isJoining,
		error,
		joinRoom,
		leaveRoom
	} = useMultiplayer()

	const [roomId, setRoomId] = useState('classroom-1')
	const [username, setUsername] = useState('')
	const [isVisible, setIsVisible] = useState(true)

	const handleJoinRoom = () => {
		if (!username.trim()) {
			alert('Vui lòng nhập tên người chơi')
			return
		}

		joinRoom(roomId, {
			userId: `user-${Date.now()}`, // Temporary user ID
			username: username.trim()
		})
	}

	const handleLeaveRoom = () => {
		leaveRoom()
	}

	const renderContent = () => {
		if (!isConnected) {
			return (
				<Card className="w-80 bg-white shadow-lg border border-gray-200">
					<CardHeader>
						<h3 className="text-lg font-semibold">Multiplayer</h3>
					</CardHeader>
					<CardBody>
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
							<span className="text-sm text-gray-600">Đang kết nối...</span>
						</div>
						{error && (
							<div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
								{error}
							</div>
						)}
					</CardBody>
				</Card>
			)
		}

		if (currentRoom && currentPlayer) {
			return (
				<Card className="w-80 bg-white shadow-lg border border-gray-200">
					<CardHeader className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Multiplayer</h3>
						<Chip color="success" size="sm">Đã kết nối</Chip>
					</CardHeader>
					<CardBody className="space-y-3">
						<div>
							<p className="text-sm text-gray-600">Phòng: <strong>{currentRoom}</strong></p>
							<p className="text-sm text-gray-600">Tên: <strong>{currentPlayer.username}</strong></p>
						</div>
						
						<div>
							<p className="text-sm text-gray-600 mb-1">
								Người chơi khác: <strong>{otherPlayers.size}</strong>
							</p>
							{otherPlayers.size > 0 && (
								<div className="flex flex-wrap gap-1">
									{Array.from(otherPlayers.values()).map(player => (
										<Chip key={player.id} size="sm" variant="flat">
											{player.username}
										</Chip>
									))}
								</div>
							)}
						</div>

						<Button
							color="danger"
							variant="flat"
							size="sm"
							onClick={handleLeaveRoom}
							className="w-full"
						>
							Rời phòng
						</Button>
					</CardBody>
				</Card>
			)
		}

		return (
			<Card className="w-80 bg-white shadow-lg border border-gray-200">
				<CardHeader>
					<h3 className="text-lg font-semibold">Tham gia Multiplayer</h3>
				</CardHeader>
				<CardBody className="space-y-3">
					<div className="flex items-center gap-2 mb-3">
						<div className="w-2 h-2 bg-green-500 rounded-full" />
						<span className="text-sm text-gray-600">Đã kết nối server</span>
					</div>

					<Input
						label="Tên người chơi"
						placeholder="Nhập tên của bạn"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						size="sm"
					/>

					<Input
						label="ID Phòng"
						placeholder="classroom-1"
						value={roomId}
						onChange={(e) => setRoomId(e.target.value)}
						size="sm"
					/>

					<Button
						color="primary"
						onClick={handleJoinRoom}
						isLoading={isJoining}
						disabled={!username.trim() || !roomId.trim()}
						className="w-full"
					>
						{isJoining ? 'Đang tham gia...' : 'Tham gia phòng'}
					</Button>

					{error && (
						<div className="p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
							{error}
						</div>
					)}
				</CardBody>
			</Card>
		)
	}

	return (
		<div className="absolute bottom-4 right-4 z-[50] flex flex-col items-end gap-2">
			{/* Toggle Button */}
			<Button
				size="sm"
				variant="flat"
				onClick={() => setIsVisible(!isVisible)}
				className="bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white"
			>
				{isVisible ? '👁️ Ẩn' : '👁️‍🗨️ Hiện'} Multiplayer
			</Button>

			{/* Content Card */}
			<div
				className={`transition-all duration-300 ease-in-out ${
					isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
				}`}
			>
				{renderContent()}
			</div>
		</div>
	)
}
