import { describe, it, expect } from 'vitest';
import { ScreenManager } from '../screen-manager';

type TestScreen = 'menu' | 'playing' | 'paused' | 'gameover';

describe('ScreenManager', () => {
  it('starts with null current screen', () => {
    const manager = new ScreenManager<TestScreen>();
    expect(manager.current).toBeNull();
  });

  it('go() transitions to a new screen', () => {
    const manager = new ScreenManager<TestScreen>();
    manager.go('menu');
    expect(manager.current).toBe('menu');
  });

  it('does nothing when going to the same screen', () => {
    const manager = new ScreenManager<TestScreen>();
    const calls: string[] = [];
    manager.onTransition((_from, to) => calls.push(to));

    manager.go('menu');
    manager.go('menu');
    expect(calls).toEqual(['menu']);
  });

  it('notifies listeners on transition', () => {
    const manager = new ScreenManager<TestScreen>();
    const transitions: [TestScreen | null, TestScreen][] = [];
    manager.onTransition((from, to) => transitions.push([from, to]));

    manager.go('menu');
    manager.go('playing');
    manager.go('paused');

    expect(transitions).toEqual([
      [null, 'menu'],
      ['menu', 'playing'],
      ['playing', 'paused'],
    ]);
  });

  it('onTransition returns an unsubscribe function', () => {
    const manager = new ScreenManager<TestScreen>();
    const calls: string[] = [];
    const unsub = manager.onTransition((_from, to) => calls.push(to));

    manager.go('menu');
    unsub();
    manager.go('playing');

    expect(calls).toEqual(['menu']);
  });

  it('dispose clears state and listeners', () => {
    const manager = new ScreenManager<TestScreen>();
    const calls: string[] = [];
    manager.onTransition((_from, to) => calls.push(to));

    manager.go('menu');
    manager.dispose();
    expect(manager.current).toBeNull();

    manager.go('playing');
    expect(calls).toEqual(['menu']); // listener not called after dispose
  });
});
