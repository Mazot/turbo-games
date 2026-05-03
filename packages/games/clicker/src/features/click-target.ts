import * as THREE from 'three';
import { Object3DFeature } from '@turbo-games/renderer';
import type { CoreContext, ModulesRecord } from '@turbo-games/renderer';

export class ClickTarget extends Object3DFeature<ModulesRecord> {
  onClicked: (() => void) | null = null;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private animProgress = -1;
  private wobbleDir = 1;
  private baseScale: THREE.Vector3 | null = null;

  /** Updates the base scale used by idle/click animations. Call after changing sprite size. */
  setBaseScale(x: number, y: number): void {
    if (!this.baseScale) this.baseScale = new THREE.Vector3(x, y, 1);
    else this.baseScale.set(x, y, 1);
  }

  /** Programmatically triggers the same bounce + wobble animation as a real click. */
  triggerClickEffect(): void {
    this.animProgress = 0;
    this.wobbleDir *= -1;
  }

  protected useCtx(ctx: CoreContext<ModulesRecord>) {
    const canvas = ctx.three.renderer.domElement;

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, ctx.three.camera);
      const hits = this.raycaster.intersectObject(this.object, false);

      if (hits.length > 0) {
        this.animProgress = 0;
        this.wobbleDir *= -1;
        this.onClicked?.();
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    return () => canvas.removeEventListener('pointerdown', onPointerDown);
  }

  onBeforeRender(ctx: CoreContext<ModulesRecord>) {
    if (!this.baseScale) this.baseScale = this.object.scale.clone();

    if (this.animProgress < 0) {
      const idle = 1 + 0.015 * Math.sin(ctx.time * 2);
      this.object.scale.set(this.baseScale.x * idle, this.baseScale.y * idle, this.baseScale.z);
      this.object.rotation.z = 0.01 * Math.sin(ctx.time * 1.5);
      return;
    }

    this.animProgress += ctx.deltaTime * 5;

    if (this.animProgress >= 1) {
      this.animProgress = -1;
      this.object.scale.copy(this.baseScale);
      this.object.rotation.z = 0;
      return;
    }

    const t = this.animProgress;
    const bounce = 1 + 0.08 * Math.sin(t * Math.PI);
    const wobble = this.wobbleDir * 0.04 * Math.sin(t * Math.PI);

    this.object.scale.set(this.baseScale.x * bounce, this.baseScale.y * bounce, this.baseScale.z);
    this.object.rotation.z = wobble;
  }
}
