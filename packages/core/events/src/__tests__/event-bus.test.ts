import { describe, it, expect, vi } from 'vitest';
import { GameEventBus } from '../event-bus';
import type { GameEvents } from '../types';

interface TestEvents extends GameEvents {
  'test:score': (score: number) => void;
  'test:hit': (target: string, damage: number) => void;
}

describe('GameEventBus', () => {
  it('emits and receives base game events', () => {
    const bus = new GameEventBus();
    const fn = vi.fn();

    bus.on('game:start', fn);
    bus.emit('game:start');

    expect(fn).toHaveBeenCalledOnce();
  });

  it('supports custom typed events', () => {
    const bus = new GameEventBus<TestEvents>();
    const fn = vi.fn();

    bus.on('test:score', fn);
    bus.emit('test:score', 42);

    expect(fn).toHaveBeenCalledWith(42);
  });

  it('supports multiple arguments', () => {
    const bus = new GameEventBus<TestEvents>();
    const fn = vi.fn();

    bus.on('test:hit', fn);
    bus.emit('test:hit', 'enemy', 10);

    expect(fn).toHaveBeenCalledWith('enemy', 10);
  });

  it('once fires only once', () => {
    const bus = new GameEventBus();
    const fn = vi.fn();

    bus.once('game:start', fn);
    bus.emit('game:start');
    bus.emit('game:start');

    expect(fn).toHaveBeenCalledOnce();
  });

  it('off removes listener', () => {
    const bus = new GameEventBus();
    const fn = vi.fn();

    bus.on('game:start', fn);
    bus.off('game:start', fn);
    bus.emit('game:start');

    expect(fn).not.toHaveBeenCalled();
  });

  it('removeAllListeners clears all for a given event', () => {
    const bus = new GameEventBus<TestEvents>();
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    bus.on('test:score', fn1);
    bus.on('test:score', fn2);
    bus.removeAllListeners('test:score');
    bus.emit('test:score', 1);

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).not.toHaveBeenCalled();
  });

  it('dispose removes all listeners', () => {
    const bus = new GameEventBus<TestEvents>();
    const fn = vi.fn();

    bus.on('game:start', fn);
    bus.on('test:score', fn);
    bus.dispose();
    bus.emit('game:start');
    bus.emit('test:score', 1);

    expect(fn).not.toHaveBeenCalled();
  });

  it('emit returns true when listeners exist', () => {
    const bus = new GameEventBus();
    bus.on('game:start', () => {});
    expect(bus.emit('game:start')).toBe(true);
  });

  it('emit returns false when no listeners', () => {
    const bus = new GameEventBus();
    expect(bus.emit('game:start')).toBe(false);
  });

  it('game:error receives Error argument', () => {
    const bus = new GameEventBus();
    const fn = vi.fn();
    const err = new Error('test');

    bus.on('game:error', fn);
    bus.emit('game:error', err);

    expect(fn).toHaveBeenCalledWith(err);
  });
});
