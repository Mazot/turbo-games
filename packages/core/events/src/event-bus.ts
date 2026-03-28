import EventEmitter from 'eventemitter3';
import type { GameEvents } from './types';

/**
 * Typed event bus wrapper over EventEmitter3.
 * Extend GameEvents interface to add game-specific events.
 */
export class GameEventBus<T extends GameEvents = GameEvents> {
  private emitter = new EventEmitter();

  on<K extends keyof T>(event: K, listener: T[K] extends (...args: infer A) => void ? (...args: A) => void : never): this {
    this.emitter.on(event as string, listener as EventEmitter.ListenerFn);
    return this;
  }

  once<K extends keyof T>(event: K, listener: T[K] extends (...args: infer A) => void ? (...args: A) => void : never): this {
    this.emitter.once(event as string, listener as EventEmitter.ListenerFn);
    return this;
  }

  off<K extends keyof T>(event: K, listener: T[K] extends (...args: infer A) => void ? (...args: A) => void : never): this {
    this.emitter.off(event as string, listener as EventEmitter.ListenerFn);
    return this;
  }

  emit<K extends keyof T>(event: K, ...args: T[K] extends (...args: infer A) => void ? A : never): boolean {
    return this.emitter.emit(event as string, ...args);
  }

  removeAllListeners(event?: keyof T): this {
    this.emitter.removeAllListeners(event as string);
    return this;
  }

  dispose(): void {
    this.emitter.removeAllListeners();
  }
}
