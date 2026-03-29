import type * as THREE from 'three';

export interface PhysicsConfig {
  gravity?: { x: number; y: number; z: number };
}

/** Collision event data passed to listeners */
export interface CollisionEvent {
  /** The other object involved in the collision */
  other: THREE.Object3D;
  /** Whether this is the start or end of a collision */
  started: boolean;
}

/** Listener signature for collision callbacks */
export type CollisionListener = (event: CollisionEvent) => void;
