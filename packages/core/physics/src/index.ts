export { createPhysicsModule, RAPIER } from './physics-world';
export type { PhysicsConfig, CollisionEvent, CollisionListener } from './types';

// Re-export kvy-core Rapier addon features
export {
  RapierPhysics,
  RapierDebugRenderer,
  Rigidbody,
  RigidbodyDynamic,
  RigidbodyFixed,
  RigidbodyKinematic,
  Collider,
  CuboidCollider,
  CapsuleCollider,
  BallCollider,
  ConeCollider,
  CylinderCollider,
  TrimeshCollider,
  ConvexMeshCollider,
} from '@vladkrutenyuk/three-kvy-core/addons';
