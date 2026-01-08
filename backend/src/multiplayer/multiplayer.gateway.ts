import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MultiplayerService } from './multiplayer.service';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  PlayerPosition,
  PlayerRotation,
} from '../common/types/multiplayer.types';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard' // Commented out for now

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/multiplayer',
})
export class MultiplayerGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >;

  private readonly logger = new Logger(MultiplayerGateway.name);

  constructor(private readonly multiplayerService: MultiplayerService) {}

  handleConnection(
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {
    this.logger.log(`Client connected: ${client.id}`);

    // Có thể thêm authentication ở đây nếu cần
    // const token = client.handshake.auth.token
    // if (!token) {
    //   client.disconnect()
    //   return
    // }
  }

  handleDisconnect(
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Xóa player khỏi room khi disconnect
    if (client.data.roomId && client.data.playerId) {
      const removed = this.multiplayerService.removePlayerFromRoom(
        client.data.roomId,
        client.data.playerId,
      );

      if (removed) {
        // Thông báo cho các player khác trong room
        client.to(client.data.roomId).emit('player-left', client.data.playerId);
      }
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    @MessageBody()
    data: { roomId: string; userData: { userId: string; username: string } },
  ) {
    try {
      // Validate data
      if (!data || !data.roomId || !data.userData) {
        this.logger.error('Invalid join-room data:', data);
        client.disconnect();
        return;
      }

      if (!data.userData.userId || !data.userData.username) {
        this.logger.error('Missing userId or username:', data.userData);
        client.disconnect();
        return;
      }

      const { roomId, userData } = data;
      const playerId = client.id;

      // Rời room cũ nếu có
      if (client.data.roomId && client.data.playerId) {
        await client.leave(client.data.roomId);
        this.multiplayerService.removePlayerFromRoom(
          client.data.roomId,
          client.data.playerId,
        );
      }

      // Join room mới
      await client.join(roomId);

      // Thêm player vào service
      const player = this.multiplayerService.addPlayerToRoom(
        roomId,
        playerId,
        userData.userId,
        userData.username,
      );

      // Lưu thông tin vào socket data
      client.data.playerId = playerId;
      client.data.userId = userData.userId;
      client.data.username = userData.username;
      client.data.roomId = roomId;

      // Lấy danh sách tất cả players trong room
      const playersInRoom = this.multiplayerService.getPlayersInRoom(roomId);

      // Gửi danh sách players cho client vừa join
      client.emit('room-joined', roomId, playersInRoom);

      // Thông báo cho các client khác về player mới
      client.to(roomId).emit('player-joined', player);

      this.logger.log(`Player ${userData.username} joined room ${roomId}`);
    } catch (error) {
      this.logger.error('Error joining room:', error);
      // Send error through a custom event since 'error' is not in ServerToClientEvents
      client.disconnect();
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {
    try {
      if (!client.data.roomId || !client.data.playerId) {
        return;
      }

      const roomId = client.data.roomId;
      const playerId = client.data.playerId;

      // Rời room
      await client.leave(roomId);

      // Xóa player khỏi service
      const removed = this.multiplayerService.removePlayerFromRoom(
        roomId,
        playerId,
      );

      if (removed) {
        // Thông báo cho các player khác
        client.to(roomId).emit('player-left', playerId);
      }

      // Clear socket data
      delete client.data.roomId;
      delete client.data.playerId;
      delete client.data.userId;
      delete client.data.username;

      this.logger.log(`Player ${playerId} left room ${roomId}`);
    } catch (error) {
      this.logger.error('Error leaving room:', error);
    }
  }

  @SubscribeMessage('player-move')
  handlePlayerMove(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
    @MessageBody()
    data: {
      position: PlayerPosition;
      rotation: PlayerRotation;
      isMoving: boolean;
    },
  ) {
    try {
      if (!client.data.roomId || !client.data.playerId) {
        this.logger.warn(
          `Player move received but player not in room: ${client.id}`,
        );
        return;
      }

      // Validate data
      if (!data || !data.position || !data.rotation) {
        this.logger.error('Invalid player-move data:', data);
        return;
      }

      const { position, rotation, isMoving } = data;
      const roomId = client.data.roomId;
      const playerId = client.data.playerId;

      // Validate position values
      if (
        typeof position.x !== 'number' ||
        typeof position.y !== 'number' ||
        typeof position.z !== 'number' ||
        typeof rotation.x !== 'number' ||
        typeof rotation.y !== 'number' ||
        typeof rotation.z !== 'number' ||
        typeof isMoving !== 'boolean'
      ) {
        this.logger.error('Invalid position/rotation types:', {
          position,
          rotation,
          isMoving,
        });
        return;
      }

      // Cập nhật position trong service
      const updatedPlayer = this.multiplayerService.updatePlayerPosition(
        roomId,
        playerId,
        position,
        rotation,
        isMoving,
      );

      if (updatedPlayer) {
        // Broadcast movement cho các player khác trong room
        client
          .to(roomId)
          .emit('player-moved', playerId, position, rotation, isMoving);
      } else {
        this.logger.warn(
          `Failed to update player position: ${playerId} in room ${roomId}`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling player move:', error);
    }
  }

  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket()
    client: Socket<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >,
  ) {
    // Immediately respond with pong for latency measurement
    client.emit('pong');
  }

  // Utility method để broadcast message cho tất cả clients trong room
  broadcastToRoom(
    roomId: string,
    event: keyof ServerToClientEvents,
    ...args: any[]
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.server.to(roomId).emit(event as any, ...args);
  }

  // Method để lấy thông tin room (có thể dùng cho admin)
  getRoomInfo(roomId: string) {
    return this.multiplayerService.getPlayersInRoom(roomId);
  }
}
