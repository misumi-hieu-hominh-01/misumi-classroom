'use client'

import { useState, useEffect } from 'react'
import { Button } from '@nextui-org/react'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { Chip } from '@nextui-org/react'
import { useMultiplayer } from '@/contexts/MultiplayerContext'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users-api'

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

	const [isVisible, setIsVisible] = useState(true)

	// Lấy thông tin user hiện tại
	const { data: userInfo } = useQuery({
		queryKey: ['user-info'],
		queryFn: () => usersApi.getCurrentUser(),
		retry: false
	})

	// Tự động join room khi có user info và đã connected
	useEffect(() => {
		if (isConnected && userInfo && !currentRoom && !isJoining) {
			// Auto join với roomId và displayName từ user account
			joinRoom(userInfo.roomId, {
				userId: userInfo.id,
				username: userInfo.displayName
			})
		}
	}, [isConnected, userInfo, currentRoom, isJoining, joinRoom])

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
					<h3 className="text-lg font-semibold">Multiplayer</h3>
				</CardHeader>
				<CardBody className="space-y-3">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-green-500 rounded-full" />
						<span className="text-sm text-gray-600">Đã kết nối server</span>
					</div>

					{userInfo ? (
						<>
							<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
								<p className="text-sm text-gray-600">Đang tự động join phòng...</p>
								<p className="text-xs text-gray-500 mt-1">
									Phòng: <strong>{userInfo.roomId}</strong>
								</p>
								<p className="text-xs text-gray-500">
									Tên: <strong>{userInfo.displayName}</strong>
								</p>
							</div>
						</>
					) : (
						<div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
							<p className="text-sm text-gray-600">Đang tải thông tin...</p>
						</div>
					)}

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
