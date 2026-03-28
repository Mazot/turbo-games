/** Base game events — extend this interface in your game */
export interface GameEvents {
  'game:start': () => void;
  'game:pause': () => void;
  'game:resume': () => void;
  'game:stop': () => void;
  'game:error': (error: Error) => void;
}
