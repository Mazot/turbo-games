import RAPIER from '@dimforge/rapier3d-compat';
import { RapierPhysics } from '@vladkrutenyuk/three-kvy-core/addons';
import type { PhysicsConfig } from './types';

/**
 * Initializes Rapier WASM and creates a RapierPhysics module
 * ready to be assigned to a CoreContext.
 */
export async function createPhysicsModule(config: PhysicsConfig = {}): Promise<RapierPhysics> {
  await RAPIER.init();

  const g = config.gravity ?? { x: 0, y: -9.81, z: 0 };
  return new RapierPhysics(RAPIER as never, {
    gravity: [g.x, g.y, g.z],
  });
}

export { RAPIER };
