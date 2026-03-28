export { GameRenderer } from './game-renderer';
export type { RendererConfig } from './types';

// Re-export kvy-core essentials for convenience
export {
  CoreContext,
  CoreContextModule,
  Object3DFeature,
  addFeature,
  getFeature,
  getFeatureBy,
  getFeatures,
  clear,
} from '@vladkrutenyuk/three-kvy-core';
export type { ModulesRecord } from '@vladkrutenyuk/three-kvy-core';

// Re-export KeysInput addon
export { KeysInput } from '@vladkrutenyuk/three-kvy-core/addons';
