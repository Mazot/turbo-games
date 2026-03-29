import * as THREE from 'three';
import { Object3DFeature, CoreContext } from '@vladkrutenyuk/three-kvy-core';
import type { ModulesRecord } from '@vladkrutenyuk/three-kvy-core';
import type { AnimationConfig } from './types';

export class SpriteAnimator extends Object3DFeature<ModulesRecord> {
  private _currentAnimation = 'idle';
  private _frameIndex = 0;
  private _frameTime = 0;
  private _animations: AnimationConfig | null = null;
  private _spriteSheet: THREE.Texture | null = null;
  private _framesX = 1;
  private _framesY = 1;

  setup(
    animations: AnimationConfig,
    spriteSheet: THREE.Texture,
    framesX: number,
    framesY: number,
  ): void {
    this._animations = animations;
    this._spriteSheet = spriteSheet;
    this._framesX = framesX;
    this._framesY = framesY;
    spriteSheet.repeat.set(1 / framesX, 1 / framesY);
  }

  playAnimation(name: string): void {
    if (name === this._currentAnimation) return;
    if (!this._animations || !this._animations[name]) return;

    this._currentAnimation = name;
    this._frameIndex = 0;
    this._frameTime = 0;
    this._updateFrame();
  }

  getCurrentAnimation(): string {
    return this._currentAnimation;
  }

  protected useCtx(_ctx: CoreContext<ModulesRecord>) {
    return () => {};
  }

  onBeforeRender(ctx: CoreContext<ModulesRecord>): void {
    if (!this._animations) return;

    const anim = this._animations[this._currentAnimation];
    if (!anim || anim.frames.length === 0) return;

    const frameDuration = 1 / (anim.frameRate || 1);

    this._frameTime += ctx.deltaTime;

    if (this._frameTime >= frameDuration) {
      this._frameTime = 0;
      this._frameIndex++;

      if (this._frameIndex >= anim.frames.length) {
        this._frameIndex = anim.loop ? 0 : anim.frames.length - 1;
      }

      this._updateFrame();
    }
  }

  private _updateFrame(): void {
    if (!this._animations || !this._spriteSheet) return;

    const anim = this._animations[this._currentAnimation];
    if (!anim) return;

    const frameNumber = anim.frames[this._frameIndex];
    const col = frameNumber % this._framesX;
    const row = Math.floor(frameNumber / this._framesX);

    this._spriteSheet.offset.set(col / this._framesX, 1 - (row + 1) / this._framesY);
  }
}
