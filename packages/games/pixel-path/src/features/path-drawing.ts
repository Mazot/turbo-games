import * as THREE from 'three';
import { Object3DFeature } from '@turbo-games/renderer';
import type { CoreContext, ModulesRecord } from '@turbo-games/renderer';

export class PathDrawing extends Object3DFeature<ModulesRecord> {
  onPathComplete: ((points: THREE.Vector3[]) => void) | null = null;
  onPathClear: (() => void) | null = null;

  private isDrawing = false;
  private points: THREE.Vector3[] = [];
  private lineMaterial: THREE.LineBasicMaterial | null = null;
  private line: THREE.Line | null = null;
  private maxPathLength = 500;
  private pathColor = 0x00ffff;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private drawPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private intersectPoint = new THREE.Vector3();

  setMaxPathLength(length: number): void {
    this.maxPathLength = length;
  }

  setPathColor(color: number): void {
    this.pathColor = color;
    if (this.lineMaterial) {
      this.lineMaterial.color.setHex(color);
    }
  }

  clearPath(): void {
    this.points = [];
    if (this.line) {
      this.object.remove(this.line);
      this.line.geometry.dispose();
      this.line = null;
    }
    this.onPathClear?.();
  }

  getPathPoints(): THREE.Vector3[] {
    return [...this.points];
  }

  protected useCtx(ctx: CoreContext<ModulesRecord>) {
    const canvas = ctx.three.renderer.domElement;

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: this.pathColor,
      linewidth: 2,
    });

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      this.isDrawing = true;
      this.clearPath();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDrawing) return;

      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, ctx.three.camera);
      this.raycaster.ray.intersectPlane(this.drawPlane, this.intersectPoint);

      if (this.points.length === 0) {
        this.points.push(this.intersectPoint.clone());
      } else {
        const lastPoint = this.points[this.points.length - 1];
        const dist = lastPoint.distanceTo(this.intersectPoint);

        if (dist > 0.1) {
          this.points.push(this.intersectPoint.clone());
          this.updateLine();
        }
      }

      // Check max length
      if (this.getTotalPathLength() > this.maxPathLength) {
        this.isDrawing = false;
        this.finalizePath();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.finalizePath();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);

      if (this.lineMaterial) {
        this.lineMaterial.dispose();
        this.lineMaterial = null;
      }
      if (this.line) {
        this.object.remove(this.line);
        this.line.geometry.dispose();
        this.line = null;
      }
    };
  }

  private updateLine(): void {
    if (this.points.length < 2) return;

    if (this.line) {
      this.object.remove(this.line);
      this.line.geometry.dispose();
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(this.points);
    this.line = new THREE.Line(geometry, this.lineMaterial!);
    this.object.add(this.line);
  }

  private finalizePath(): void {
    if (this.points.length < 2) {
      this.clearPath();
      return;
    }
    this.onPathComplete?.(this.points);
  }

  private getTotalPathLength(): number {
    let total = 0;
    for (let i = 1; i < this.points.length; i++) {
      total += this.points[i - 1].distanceTo(this.points[i]);
    }
    return total;
  }
}
