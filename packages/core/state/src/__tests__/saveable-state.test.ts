import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveableState } from '../saveable-state';
import type { SaveData } from '../types';

/* Minimal localStorage polyfill for Node test environment */
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
  } as Storage;
}

interface TestSave extends SaveData {
  score: number;
  name: string;
}

class TestState extends SaveableState<TestSave> {
  score = 0;
  name = 'default';

  constructor() {
    super('test-save-key');
  }

  protected serialize(): TestSave {
    return { score: this.score, name: this.name };
  }

  protected deserialize(data: TestSave): void {
    this.score = data.score ?? 0;
    this.name = data.name ?? 'default';
  }
}

describe('SaveableState', () => {
  let state: TestState;

  beforeEach(() => {
    localStorage.clear();
    state = new TestState();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and loads state', () => {
    state.score = 42;
    state.name = 'test';
    state.save();

    const loaded = new TestState();
    loaded.load();
    expect(loaded.score).toBe(42);
    expect(loaded.name).toBe('test');
  });

  it('hasSave returns false when no save exists', () => {
    expect(state.hasSave()).toBe(false);
  });

  it('hasSave returns true after saving', () => {
    state.save();
    expect(state.hasSave()).toBe(true);
  });

  it('clearSave removes saved data', () => {
    state.save();
    expect(state.hasSave()).toBe(true);
    state.clearSave();
    expect(state.hasSave()).toBe(false);
  });

  it('load does nothing when no save exists', () => {
    state.score = 99;
    state.load();
    expect(state.score).toBe(99); // unchanged
  });

  it('handles corrupted save data gracefully', () => {
    localStorage.setItem('test-save-key', 'not-valid-json');
    expect(() => state.load()).not.toThrow();
  });

  it('handles localStorage quota errors on save', () => {
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new DOMException('QuotaExceededError');
    };
    expect(() => state.save()).not.toThrow();
    localStorage.setItem = original;
  });
});
