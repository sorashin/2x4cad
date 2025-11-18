import { Quaternion as ThreeQuaternion, Vector3 as ThreeVector3 } from 'three';
import type { Vector3 } from '../../types/lumber';
import { LUMBER_DIMENSIONS } from '../../types/lumber';
import { mmToUnits } from '../../constants';
import { useInteractionStore } from '../../stores/interaction';

interface PreviewLumberProps {
  start: Vector3;
  end: Vector3;
}

/**
 * Preview lumber component shown during placement
 * Displays a semi-transparent lumber between start and end points
 */
export function PreviewLumber({ start, end }: PreviewLumberProps) {
  const selectedLumberType = useInteractionStore((s) => s.selectedLumberType);
  const dimensions = LUMBER_DIMENSIONS[selectedLumberType];

  // Snap end point to closest axis
  const snappedEnd = snapToAxis(start, end);

  // Calculate direction and length
  const dx = snappedEnd.x - start.x;
  const dy = snappedEnd.y - start.y;
  const dz = snappedEnd.z - start.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (length < 1) {
    return null; // Don't render if length is too small
  }

  // Calculate direction vector
  const dir = {
    x: dx / length,
    y: dy / length,
    z: dz / length,
  };

  // Calculate rotation quaternion from Y-axis to direction
  const quaternion = calculateRotationQuaternion({ x: 0, y: 1, z: 0 }, dir);

  // Position at start point (mm → Three.js units)
  const position = new ThreeVector3(
    mmToUnits(start.x),
    mmToUnits(start.y),
    mmToUnits(start.z)
  );

  // Offset to center
  const direction = new ThreeVector3(0, 1, 0).applyQuaternion(
    new ThreeQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
  );
  const centerOffset = direction.multiplyScalar(mmToUnits(length) / 2);
  const centerPosition = position.clone().add(centerOffset);

  return (
    <mesh
      position={centerPosition}
      quaternion={new ThreeQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)}
    >
      <boxGeometry
        args={[
          mmToUnits(dimensions.width),
          mmToUnits(length),
          mmToUnits(dimensions.height),
        ]}
      />
      <meshStandardMaterial
        color="#00BFFF"
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Default preview lumber that follows mouse cursor
 * Shows a 100mm lumber for visual guidance
 */
export function DefaultPreviewLumber({ position }: { position: Vector3 }) {
  const selectedLumberType = useInteractionStore((s) => s.selectedLumberType);
  const dimensions = LUMBER_DIMENSIONS[selectedLumberType];

  const DEFAULT_LENGTH = 100; // 100mm default length

  // Position in Three.js units
  const centerPosition = new ThreeVector3(
    mmToUnits(position.x),
    mmToUnits(position.y) + mmToUnits(DEFAULT_LENGTH) / 2,
    mmToUnits(position.z)
  );

  return (
    <mesh position={centerPosition}>
      <boxGeometry
        args={[
          mmToUnits(dimensions.width),
          mmToUnits(DEFAULT_LENGTH),
          mmToUnits(dimensions.height),
        ]}
      />
      <meshStandardMaterial
        color="#00BFFF"
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </mesh>
  );
}

// Helper functions

function snapToAxis(start: Vector3, end: Vector3): Vector3 {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dz = Math.abs(end.z - start.z);

  if (dx >= dy && dx >= dz) {
    return { x: end.x, y: start.y, z: start.z };
  } else if (dy >= dx && dy >= dz) {
    return { x: start.x, y: end.y, z: start.z };
  } else {
    return { x: start.x, y: start.y, z: end.z };
  }
}

function calculateRotationQuaternion(from: Vector3, to: Vector3): {
  x: number;
  y: number;
  z: number;
  w: number;
} {
  const cross = {
    x: from.y * to.z - from.z * to.y,
    y: from.z * to.x - from.x * to.z,
    z: from.x * to.y - from.y * to.x,
  };

  const dot = from.x * to.x + from.y * to.y + from.z * to.z;
  const w = 1 + dot;
  const norm = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z + w * w);

  if (norm < 0.0001) {
    return { x: 1, y: 0, z: 0, w: 0 };
  }

  return {
    x: cross.x / norm,
    y: cross.y / norm,
    z: cross.z / norm,
    w: w / norm,
  };
}
