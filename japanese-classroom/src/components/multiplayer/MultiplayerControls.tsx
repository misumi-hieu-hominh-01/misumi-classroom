"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@nextui-org/react";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { Chip } from "@nextui-org/react";
import { Eye, EyeOff } from "lucide-react";
import { useMultiplayer } from "@/contexts/MultiplayerContext";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users-api";

export function MultiplayerControls() {
  const {
    isConnected,
    currentRoom,
    currentPlayer,
    otherPlayers,
    isJoining,
    error,
    joinRoom,
    leaveRoom,
    latency,
  } = useMultiplayer();

  const [isVisible, setIsVisible] = useState(true);
  const [displayLatency, setDisplayLatency] = useState(0);

  // Lấy thông tin user hiện tại
  const { data: userInfo } = useQuery({
    queryKey: ["user-info"],
    queryFn: () => usersApi.getCurrentUser(),
    retry: false,
  });

  // Tự động join room khi có user info và đã connected
  useEffect(() => {
    if (isConnected && userInfo && !currentRoom && !isJoining) {
      // Auto join với roomId và displayName từ user account
      joinRoom(userInfo.roomId, {
        userId: userInfo.id,
        username: userInfo.displayName,
      });
    }
  }, [isConnected, userInfo, currentRoom, isJoining, joinRoom]);

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  // Update display latency every 2 seconds (using real ping latency)
  useEffect(() => {
    if (!isConnected) {
      setDisplayLatency(0);
      return;
    }

    // Update immediately when latency changes
    setDisplayLatency(latency);

    // Also update every 2 seconds to ensure UI refreshes
    const interval = setInterval(() => {
      setDisplayLatency(latency);
    }, 2000);

    return () => clearInterval(interval);
  }, [latency, isConnected]);

  // Get other players list (latency for other players is not measured, show N/A or use lastUpdate)
  const otherPlayersList = useMemo(() => {
    return Array.from(otherPlayers.values()).map((player) => ({
      ...player,
      // For other players, we can't measure their ping directly
      // So we'll show a placeholder or estimate based on connection quality
      latency: 0, // Will be updated if we implement peer-to-peer latency measurement
    }));
  }, [otherPlayers]);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <Card className="w-96 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/50 rounded-xl">
          <CardHeader className="pb-3 border-b border-gray-200/50">
            <div className="flex justify-between items-center w-full">
              <h3 className="text-xl font-bold text-gray-800">Multiplayer</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <Chip color="danger" size="sm" variant="flat">
                  Đang kết nối...
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardBody>
        </Card>
      );
    }

    if (currentRoom && currentPlayer) {
      return (
        <Card className="w-96 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/50 rounded-xl">
          <CardHeader className="pb-3 border-b border-gray-200/50">
            <div className="flex justify-between items-center w-full">
              <h3 className="text-xl font-bold text-gray-800">{currentRoom}</h3>
              <div className="flex items-center text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Chip color="success" size="sm" variant="flat">
                  {displayLatency}ms
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {/* Other Players List */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Người chơi khác ({otherPlayersList.length}):
              </p>
              {otherPlayersList.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {otherPlayersList.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-2 bg-gray-50/50 rounded-lg hover:bg-gray-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {player.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {player.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic text-center py-4">
                  Chưa có người chơi khác
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-gray-200/50 space-y-2">
              <Button
                color="primary"
                variant="solid"
                size="md"
                onClick={() => {
                  // TODO: Implement invite friends functionality
                  console.log("Invite friends");
                }}
                className="w-full font-semibold text-white bold bg-blue-500 hover:bg-blue-600 hover:text-white"
              >
                Mời bạn bè
              </Button>
              <Button
                color="danger"
                variant="flat"
                size="md"
                onClick={handleLeaveRoom}
                className="w-full text-white font-medium bg-red-500 bold hover:bg-red-600 hover:text-white"
              >
                Rời phòng
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    return (
      <Card className="w-96 bg-white/95 backdrop-blur-sm shadow-xl border border-gray-200/50 rounded-xl">
        <CardHeader className="pb-3 border-b border-gray-200/50">
          <div className="flex justify-between items-center w-full">
            <h3 className="text-xl font-bold text-gray-800">Multiplayer</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <Chip color="success" size="sm" variant="flat">
                Đã kết nối server
              </Chip>
            </div>
          </div>
        </CardHeader>
        <CardBody className="pt-4 space-y-3">
          {userInfo ? (
            <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Đang tự động join phòng...
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                <p>
                  Phòng:{" "}
                  <strong className="text-gray-800">{userInfo.roomId}</strong>
                </p>
                <p>
                  Tên:{" "}
                  <strong className="text-gray-800">
                    {userInfo.displayName}
                  </strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50/50 rounded-lg border border-gray-200/50">
              <p className="text-sm text-gray-600 text-center">
                Đang tải thông tin...
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="absolute bottom-4 right-4 z-[50] flex flex-col items-end gap-2">
      {/* Content Card */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {renderContent()}
      </div>

      {/* Toggle Button - Moved to bottom */}
      <Button
        size="sm"
        variant="flat"
        onClick={() => setIsVisible(!isVisible)}
        className="bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 hover:bg-white text-gray-900 font-medium"
        startContent={isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
      >
        {isVisible ? "Ẩn" : "Hiện"} Multiplayer
      </Button>
    </div>
  );
}
