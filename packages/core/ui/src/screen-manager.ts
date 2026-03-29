/**
 * Possible screen states for a game.
 * Extend this union in your game types if you need additional screens.
 */
export type ScreenName = string;

/** Listener called when a screen transition occurs */
export type ScreenTransitionListener<T extends ScreenName = ScreenName> = (
  from: T | null,
  to: T,
) => void;

/**
 * Manages game screen transitions (menu → playing → paused → gameover, etc).
 * Keeps track of the current screen and notifies listeners on transitions.
 */
export class ScreenManager<T extends ScreenName = ScreenName> {
  private _current: T | null = null;
  private _listeners: ScreenTransitionListener<T>[] = [];

  /** The currently active screen, or null if none set yet */
  get current(): T | null {
    return this._current;
  }

  /**
   * Transition to a new screen.
   * Does nothing if the screen is already active.
   */
  go(screen: T): void {
    if (screen === this._current) return;
    const from = this._current;
    this._current = screen;
    for (const listener of this._listeners) {
      listener(from, screen);
    }
  }

  /** Register a listener for screen transitions */
  onTransition(listener: ScreenTransitionListener<T>): () => void {
    this._listeners.push(listener);
    return () => {
      const idx = this._listeners.indexOf(listener);
      if (idx !== -1) this._listeners.splice(idx, 1);
    };
  }

  /** Remove all listeners */
  dispose(): void {
    this._listeners.length = 0;
    this._current = null;
  }
}
