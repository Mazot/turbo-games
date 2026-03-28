import { Client, Room } from 'colyseus.js';
import type { MultiplayerConfig, RoomOptions } from './types';

export class MultiplayerClient {
  private client: Client;
  private rooms = new Map<string, Room>();

  constructor(config: MultiplayerConfig) {
    this.client = new Client(config.serverUrl);
  }

  async joinOrCreate<T = unknown>(roomName: string, options?: RoomOptions): Promise<Room<T>> {
    const room = await this.client.joinOrCreate<T>(roomName, options);
    this.rooms.set(room.id, room as Room);
    return room;
  }

  async join<T = unknown>(roomName: string, options?: RoomOptions): Promise<Room<T>> {
    const room = await this.client.join<T>(roomName, options);
    this.rooms.set(room.id, room as Room);
    return room;
  }

  async create<T = unknown>(roomName: string, options?: RoomOptions): Promise<Room<T>> {
    const room = await this.client.create<T>(roomName, options);
    this.rooms.set(room.id, room as Room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  async leave(roomId: string, consented = true): Promise<void> {
    const room = this.rooms.get(roomId);
    if (room) {
      await room.leave(consented);
      this.rooms.delete(roomId);
    }
  }

  async dispose(): Promise<void> {
    for (const room of this.rooms.values()) {
      await room.leave();
    }
    this.rooms.clear();
  }
}
