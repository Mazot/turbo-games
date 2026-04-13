import * as THREE from 'three';
import { addFeature } from '@turbo-games/renderer';
import { RigidbodyFixed, RigidbodyDynamic, CuboidCollider, BallCollider } from '@turbo-games/physics';

export function createObstacle(
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, 0.5);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);

  // Add physics via kvy-core features
  addFeature(mesh, RigidbodyFixed as any);
  addFeature(mesh, CuboidCollider as any, {
    halfExtents: { x: width / 2, y: height / 2, z: 0.25 },
  });

  return mesh;
}

export function createGoal(
  x: number,
  y: number,
  radius: number,
  color: number,
): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
  const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

export function createBall(
  x: number,
  y: number,
  radius: number,
  color: number,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);

  // Add physics via kvy-core features
  addFeature(mesh, RigidbodyDynamic as any);
  addFeature(mesh, BallCollider as any, { radius });

  return mesh;
}

export function createPathColliders(
  points: THREE.Vector3[],
  width: number,
): THREE.Group {
  const group = new THREE.Group();

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];

    const length = p1.distanceTo(p2);
    if (length < 0.01) continue;

    const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const direction = new THREE.Vector3().subVectors(p2, p1).normalize();
    const angle = Math.atan2(direction.y, direction.x);

    const geometry = new THREE.BoxGeometry(length, width, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.rotation.z = angle;

    // Add physics via kvy-core features
    addFeature(mesh, RigidbodyFixed as any);
    addFeature(mesh, CuboidCollider as any, {
      halfExtents: { x: length / 2, y: width / 2, z: 0.1 },
      friction: 0.3,
      restitution: 0.1,
    });

    group.add(mesh);
  }

  return group;
}
