import { Injectable, Logger } from '@nestjs/common';
import {
  PlayerData,
  PlayerPosition,
  PlayerRotation,
  RoomData,
} from '../common/types/multiplayer.types';

@Injectable()
export class MultiplayerService {
  private readonly logger = new Logger(MultiplayerService.name);
  private rooms: Map<string, RoomData> = new Map();
  private readonly DEFAULT_ROOM_ID = 'classroom-1';

  constructor() {
    // Tạo room mặc định
    this.createRoom(this.DEFAULT_ROOM_ID);
  }

  createRoom(roomId: string): RoomData {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const room: RoomData = {
      id: roomId,
      players: new Map(),
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.rooms.set(roomId, room);
    this.logger.log(`Room created: ${roomId}`);
    return room;
  }

  getRoom(roomId: string): RoomData | null {
    return this.rooms.get(roomId) || null;
  }

  getDefaultRoom(): RoomData {
    return this.getRoom(this.DEFAULT_ROOM_ID)!;
  }

  addPlayerToRoom(
    roomId: string,
    playerId: string,
    userId: string,
    username: string,
  ): PlayerData {
    const room = this.getRoom(roomId) || this.createRoom(roomId);

    // Vị trí spawn ngẫu nhiên trong classroom
    const spawnPosition: PlayerPosition = {
      x: Math.random() * 10 - 5, // -5 to 5
      y: 0,
      z: Math.random() * 10 - 5, // -5 to 5
    };

    const player: PlayerData = {
      id: playerId,
      userId,
      username,
      position: spawnPosition,
      rotation: { x: 0, y: 0, z: 0 },
      isMoving: false,
      lastUpdate: Date.now(),
    };

    room.players.set(playerId, player);
    room.lastActivity = new Date();

    this.logger.log(`Player ${username} (${playerId}) joined room ${roomId}`);
    return player;
  }

  removePlayerFromRoom(roomId: string, playerId: string): boolean {
    const room = this.getRoom(roomId);
    if (!room) return false;

    const removed = room.players.delete(playerId);
    if (removed) {
      room.lastActivity = new Date();
      this.logger.log(`Player ${playerId} left room ${roomId}`);
    }

    // Xóa room nếu không còn player nào (trừ room mặc định)
    if (room.players.size === 0 && roomId !== this.DEFAULT_ROOM_ID) {
      this.rooms.delete(roomId);
      this.logger.log(`Room ${roomId} deleted (empty)`);
    }

    return removed;
  }

  updatePlayerPosition(
    roomId: string,
    playerId: string,
    position: PlayerPosition,
    rotation: PlayerRotation,
    isMoving: boolean,
  ): PlayerData | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    // Validate position (giới hạn trong classroom)
    const validatedPosition: PlayerPosition = {
      x: Math.max(-20, Math.min(20, position.x)),
      y: Math.max(-1, Math.min(5, position.y)),
      z: Math.max(-20, Math.min(20, position.z)),
    };

    player.position = validatedPosition;
    player.rotation = rotation;
    player.isMoving = isMoving;
    player.lastUpdate = Date.now();
    room.lastActivity = new Date();

    return player;
  }

  getPlayersInRoom(roomId: string): PlayerData[] {
    const room = this.getRoom(roomId);
    if (!room) return [];

    return Array.from(room.players.values());
  }

  getPlayerInRoom(roomId: string, playerId: string): PlayerData | null {
    const room = this.getRoom(roomId);
    if (!room) return null;

    return room.players.get(playerId) || null;
  }

  // Cleanup inactive players (có thể chạy định kỳ)
  cleanupInactivePlayers(maxInactiveTime: number = 300000): void {
    // 5 minutes
    const now = Date.now();

    for (const [roomId, room] of this.rooms) {
      const playersToRemove: string[] = [];

      for (const [playerId, player] of room.players) {
        if (now - player.lastUpdate > maxInactiveTime) {
          playersToRemove.push(playerId);
        }
      }

      playersToRemove.forEach((playerId) => {
        this.removePlayerFromRoom(roomId, playerId);
      });
    }
  }

  getRoomStats(): {
    roomId: string;
    playerCount: number;
    lastActivity: Date;
  }[] {
    return Array.from(this.rooms.values()).map((room) => ({
      roomId: room.id,
      playerCount: room.players.size,
      lastActivity: room.lastActivity,
    }));
  }
}
