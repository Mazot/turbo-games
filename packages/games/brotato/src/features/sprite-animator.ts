import * as THREE from 'three';
import { Object3DFeature, CoreContext } from '@turbo-games/renderer';
import type { AnimationConfig, AnimationFrames } from '../types';

export class SpriteAnimator extends Object3DFeature {
  private _currentAnimation = 'idle';
  private _frameIndex = 0;
  private _frameTime = 0;
  private _animations: AnimationConfig;
  private _spriteSheet: THREE.Texture;
  private _framesX: number;
  private _framesY: number;

  constructor(
    animations: AnimationConfig,
    spriteSheet: THREE.Texture,
    framesX: number,
    framesY: number
  ) {
    super();
    this._animations = animations;
    this._spriteSheet = spriteSheet;
    this._framesX = framesX;
    this._framesY = framesY;

    spriteSheet.repeat.set(1 / framesX, 1 / framesY);
  }

  playAnimation(name: keyof AnimationConfig): void {
    if (name === this._currentAnimation) return;
    if (!this._animations[name]) return;

    this._currentAnimation = name as string;
    this._frameIndex = 0;
    this._frameTime = 0;
    this._updateFrame();
  }

  onBeforeRender(ctx: CoreContext): void {
    const anim = this._animations[this._currentAnimation as keyof AnimationConfig];
    if (!anim || anim.frames.length === 0) return;

    const frameRate = anim.frameRate || 1;
    const frameDuration = 1 / frameRate;

    this._frameTime += ctx.deltaTime;

    if (this._frameTime >= frameDuration) {
      this._frameTime = 0;
      this._frameIndex++;

      if (this._frameIndex >= anim.frames.length) {
        if (anim.loop) {
          this._frameIndex = 0;
        } else {
          this._frameIndex = anim.frames.length - 1;
        }
      }

      this._updateFrame();
    }
  }

  private _updateFrame(): void {
    const anim = this._animations[this._currentAnimation as keyof AnimationConfig];
    if (!anim) return;

    const frameNumber = anim.frames[this._frameIndex];
    const col = frameNumber % this._framesX;
    const row = Math.floor(frameNumber / this._framesX);

    this._spriteSheet.offset.set(col / this._framesX, 1 - (row + 1) / this._framesY);
  }
}
