import * as THREE from 'three';
import { Object3DFeature } from '@turbo-games/renderer';
import type { CoreContext, ModulesRecord } from '@turbo-games/renderer';

export class ClickTarget extends Object3DFeature<ModulesRecord> {
  onClicked: (() => void) | null = null;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private animProgress = -1;
  private wobbleDir = 1;
  private baseScale = new THREE.Vector3(2.5, 2.5, 1);

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
    if (this.animProgress < 0) {
      // Idle breathing
      const idle = 1 + 0.03 * Math.sin(ctx.time * 2);
      this.object.scale.set(
        this.baseScale.x * idle,
        this.baseScale.y * idle,
        this.baseScale.z,
      );
      this.object.rotation.z = 0.02 * Math.sin(ctx.time * 1.5);
      return;
    }

    // Click animation
    this.animProgress += ctx.deltaTime * 5;

    if (this.animProgress >= 1) {
      this.animProgress = -1;
      this.object.scale.copy(this.baseScale);
      this.object.rotation.z = 0;
      return;
    }

    const t = this.animProgress;
    const bounce = 1 + 0.35 * Math.sin(t * Math.PI);
    const wobble = this.wobbleDir * 0.15 * Math.sin(t * Math.PI);

    this.object.scale.set(
      this.baseScale.x * bounce,
      this.baseScale.y * bounce,
      this.baseScale.z,
    );
    this.object.rotation.z = wobble;
  }
}
