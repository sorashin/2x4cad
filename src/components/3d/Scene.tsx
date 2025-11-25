import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Raycaster, Plane, Vector3 as ThreeVector3, Vector2, Ray, MOUSE } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls';
import { useLumberStore } from '../../stores/lumber';
import { useSettingsStore } from '../../stores/settings';
import { useInteractionStore } from '../../stores/interaction';
import { Lumber } from './Lumber';
import { PreviewLumber, DefaultPreviewLumber } from './PreviewLumber';
import { HighlightedFace } from './HighlightedFace';
import { useUIMode } from '../../hooks/useUIMode';
import { unitsToMm, mmToUnits } from '../../constants';
import { 
  snapToGrid, 
  findParallelFaces, 
  findClosestParallelFace, 
  snapToFace,
  normalize,
  subtract,
} from '../../utils/geometry';

// Calculate closest points between a ray and a line segment
// Returns [pointOnRay, pointOnLine, distance]
function closestPointsRayLine(
  ray: Ray,
  lineStart: ThreeVector3,
  lineDir: ThreeVector3
): { pointOnRay: ThreeVector3; pointOnLine: ThreeVector3; distance: number } {
  const w0 = ray.origin.clone().sub(lineStart);
  const a = ray.direction.dot(ray.direction);
  const b = ray.direction.dot(lineDir);
  const c = lineDir.dot(lineDir);
  const d = ray.direction.dot(w0);
  const e = lineDir.dot(w0);

  const denom = a * c - b * b;

  let sc: number;
  let tc: number;

  if (Math.abs(denom) < 0.0001) {
    // Lines are parallel
    sc = 0;
    tc = d / b;
  } else {
    sc = (b * e - c * d) / denom;
    tc = (a * e - b * d) / denom;
  }

  // Clamp sc to be non-negative (ray starts at origin)
  sc = Math.max(0, sc);

  const pointOnRay = ray.origin.clone().add(ray.direction.clone().multiplyScalar(sc));
  const pointOnLine = lineStart.clone().add(lineDir.clone().multiplyScalar(tc));
  const distance = pointOnRay.distanceTo(pointOnLine);

  return { pointOnRay, pointOnLine, distance };
}

// Helper function to get intersection point using axis-ray method
function getAxisIntersection(
  raycaster: Raycaster,
  startPointMm: { x: number; y: number; z: number } | null
): ThreeVector3 | null {
  if (startPointMm) {
    // For end point: find closest point on axis lines from start point
    const startPointUnits = new ThreeVector3(
      startPointMm.x / 100, // mmToUnits
      startPointMm.y / 100,
      startPointMm.z / 100
    );

    // Define the three axis directions
    const axes = [
      new ThreeVector3(1, 0, 0), // X axis
      new ThreeVector3(0, 1, 0), // Y axis
      new ThreeVector3(0, 0, 1), // Z axis
    ];

    let bestPoint: ThreeVector3 | null = null;
    let bestDistance = Infinity;

    // Find the axis line that is closest to the mouse ray
    for (const axisDir of axes) {
      const result = closestPointsRayLine(
        raycaster.ray,
        startPointUnits,
        axisDir
      );

      if (result.distance < bestDistance) {
        bestDistance = result.distance;
        bestPoint = result.pointOnLine;
      }
    }

    return bestPoint;
  } else {
    // For start point: use ground plane (Y=0)
    const groundPlane = new Plane(new ThreeVector3(0, 1, 0), 0);
    const intersection = new ThreeVector3();
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      return intersection;
    }
  }

  return null;
}

// Component to handle Rhino-style camera controls
function RhinoControls() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        setIsShiftPressed(false);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.shiftKey) {
        setIsShiftPressed(true);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!e.shiftKey) {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (controlsRef.current) {
      if (isShiftPressed) {
        // Shift + 右クリックでパン
        controlsRef.current.mouseButtons = {
          LEFT: undefined,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.PAN,
        };
      } else {
        // 右クリックで回転
        controlsRef.current.mouseButtons = {
          LEFT: undefined,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.ROTATE,
        };
      }
    }
  }, [isShiftPressed]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping={false}
      mouseButtons={{
        LEFT: undefined,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.ROTATE,
      }}
    />
    
  );
}

// Component to handle mouse interactions in the 3D scene
function InteractionHandler() {
  const { camera, gl } = useThree();
  const {
    currentMode,
    currentMousePosition,
    startPoint,
    setCurrentMousePosition,
    placeStartPoint,
    placeEndPoint,
  } = useUIMode();
  const workAreaSize = useSettingsStore((s) => s.workAreaSize);
  const snapToGridEnabled = useSettingsStore((s) => s.snapToGrid);
  const gridSize = useSettingsStore((s) => s.gridSize);
  const { lumbers } = useLumberStore();
  const { 
    parallelFaces, 
    activeSnapFace,
    setParallelFaces, 
    setActiveSnapFace 
  } = useInteractionStore();

  const raycaster = useRef(new Raycaster());
  
  // 面スナップの閾値（グリッドサイズの1.5倍）
  const faceSnapThreshold = gridSize * 1.5;

  // Helper to clamp position within work area
  const clampToWorkArea = (positionMm: { x: number; y: number; z: number }) => {
    const halfSize = workAreaSize / 2;
    return {
      x: Math.max(-halfSize, Math.min(halfSize, positionMm.x)),
      y: Math.max(0, positionMm.y), // Y is height, keep non-negative
      z: Math.max(-halfSize, Math.min(halfSize, positionMm.z)),
    };
  };

  // PreviewLumberの終点方向（EndFace）の法線を計算
  const endFaceNormal = useMemo(() => {
    if (currentMode !== 'lumber_placing_end' || !startPoint || !currentMousePosition) {
      return null;
    }
    
    // 始点から終点への方向ベクトルを計算
    const direction = subtract(currentMousePosition, startPoint);
    const normalizedDir = normalize(direction);
    
    // GridSnap前提で軸方向にスナップ
    const absX = Math.abs(normalizedDir.x);
    const absY = Math.abs(normalizedDir.y);
    const absZ = Math.abs(normalizedDir.z);
    
    if (absX >= absY && absX >= absZ) {
      return { x: normalizedDir.x > 0 ? 1 : -1, y: 0, z: 0 };
    } else if (absY >= absX && absY >= absZ) {
      return { x: 0, y: normalizedDir.y > 0 ? 1 : -1, z: 0 };
    } else {
      return { x: 0, y: 0, z: normalizedDir.z > 0 ? 1 : -1 };
    }
  }, [currentMode, startPoint, currentMousePosition]);
  
  // 平行面を検出して更新
  useEffect(() => {
    if (currentMode === 'lumber_placing_end' && endFaceNormal && Object.keys(lumbers).length > 0) {
      const faces = findParallelFaces(endFaceNormal, lumbers);
      setParallelFaces(faces);
    } else {
      setParallelFaces([]);
      setActiveSnapFace(null);
    }
  }, [currentMode, endFaceNormal, lumbers, setParallelFaces, setActiveSnapFace]);

  // Update mouse position on every frame
  useFrame(({ pointer }) => {
    if (currentMode === 'idle') return;

    // Convert screen coordinates to world coordinates
    raycaster.current.setFromCamera(pointer, camera);

    // Use appropriate method based on mode
    const useStartPoint = currentMode === 'lumber_placing_end' ? startPoint : null;
    const intersection = getAxisIntersection(raycaster.current, useStartPoint);

    if (intersection) {
      // Convert from Three.js units to mm and clamp to work area
      let positionMm = clampToWorkArea({
        x: unitsToMm(intersection.x),
        y: unitsToMm(intersection.y),
        z: unitsToMm(intersection.z),
      });
      
      // 常にグリッド交点にスナップ
      if (snapToGridEnabled) {
        positionMm = snapToGrid(positionMm, gridSize);
      }
      
      // 終点選択モード時に面スナップを適用（グリッドスナップより優先）
      if (currentMode === 'lumber_placing_end' && parallelFaces.length > 0) {
        const closestFace = findClosestParallelFace(positionMm, parallelFaces, faceSnapThreshold);
        
        if (closestFace) {
          positionMm = snapToFace(positionMm, closestFace);
          setActiveSnapFace(closestFace);
        } else {
          setActiveSnapFace(null);
        }
      }
      
      setCurrentMousePosition(positionMm);
    }
  });

  const handleClick = useCallback((event: MouseEvent) => {
    if (currentMode === 'idle') return;

    // Prevent OrbitControls from handling this click
    event.stopPropagation();

    // Get current mouse position
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(new Vector2(x, y), camera);

    // Use appropriate method based on mode
    const useStartPoint = currentMode === 'lumber_placing_end' ? startPoint : null;
    const intersection = getAxisIntersection(raycaster.current, useStartPoint);

    if (intersection) {
      let positionMm = clampToWorkArea({
        x: unitsToMm(intersection.x),
        y: unitsToMm(intersection.y),
        z: unitsToMm(intersection.z),
      });

      // 常にグリッド交点にスナップ
      if (snapToGridEnabled) {
        positionMm = snapToGrid(positionMm, gridSize);
      }

      // 終点選択モード時に面スナップを適用（グリッドスナップより優先）
      if (currentMode === 'lumber_placing_end' && parallelFaces.length > 0) {
        const closestFace = findClosestParallelFace(positionMm, parallelFaces, faceSnapThreshold);
        
        if (closestFace) {
          positionMm = snapToFace(positionMm, closestFace);
        }
      }

      if (currentMode === 'lumber_placing_start') {
        placeStartPoint(positionMm);
      } else if (currentMode === 'lumber_placing_end') {
        placeEndPoint(positionMm);
      }
    }
  }, [currentMode, camera, gl, startPoint, placeStartPoint, placeEndPoint, clampToWorkArea, snapToGridEnabled, gridSize, parallelFaces, faceSnapThreshold]);

  // Attach click handler to canvas
  useFrame(() => {
    if (currentMode !== 'idle') {
      gl.domElement.style.cursor = 'crosshair';
    } else {
      gl.domElement.style.cursor = 'default';
    }
  });

  // Register click handler
  const canvasRef = gl.domElement;
  useFrame(() => {
    // This is a bit hacky, but we need to handle clicks specially during placement
    canvasRef.onclick = currentMode !== 'idle' ? handleClick : null;
  });

  return (
    <>
      {/* Show default preview when waiting for start point */}
      {currentMode === 'lumber_placing_start' && currentMousePosition && (
        <DefaultPreviewLumber position={currentMousePosition} />
      )}

      {/* Show preview lumber when start point is placed */}
      {currentMode === 'lumber_placing_end' && startPoint && currentMousePosition && (
        <PreviewLumber start={startPoint} end={currentMousePosition} />
      )}
      
      {/* 平行な面をハイライト表示 */}
      {currentMode === 'lumber_placing_end' && parallelFaces.map((faceInfo, index) => {
        // activeSnapFaceとfaceInfoを比較（オブジェクト参照ではなく内容で比較）
        const isActive = activeSnapFace !== null &&
          activeSnapFace.lumberId === faceInfo.lumberId &&
          activeSnapFace.axis === faceInfo.axis &&
          Math.abs(activeSnapFace.planePosition - faceInfo.planePosition) < 0.001;
        
        return (
          <HighlightedFace 
            key={`${faceInfo.lumberId}-${index}`}
            face={faceInfo.face}
            isActive={isActive}
          />
        );
      })}
    </>
  );
}

export function Scene() {
  const { lumbers, deselectAll } = useLumberStore();
  const { currentMode, cancelAddLumber } = useUIMode();
  const workAreaSize = useSettingsStore((s) => s.workAreaSize);
  const gridSize = useSettingsStore((s) => s.gridSize);

  // Convert work area size to Three.js units
  const workAreaUnits = mmToUnits(workAreaSize);

  const handleBackgroundClick = () => {
    // Don't deselect during placement mode
    if (currentMode !== 'idle') return;
    deselectAll();
  };

  // Handle Escape key to cancel placement
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && currentMode !== 'idle') {
      cancelAddLumber();
    }
  }, [currentMode, cancelAddLumber]);

  // Register keyboard handler
  useRef(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="w-screen h-screen">
      <Canvas
        orthographic
        camera={{ position: [50, 50, 50], zoom: 50 }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && currentMode !== 'idle') {
            cancelAddLumber();
          }
        }}
      >
        {/* 照明 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        {/* グリッド - gridSizeに応じてセルサイズを変更 */}
        <Grid
          args={[workAreaUnits, workAreaUnits]}
          cellSize={mmToUnits(gridSize)}
          cellThickness={1}
          cellColor="#6f6f6f"
          sectionSize={mmToUnits(gridSize)*10}
          sectionThickness={1.5}
          sectionColor="#9d4b4b"
          fadeDistance={workAreaUnits * 1.5}
          fadeStrength={0.9}
          followCamera={false}
          infiniteGrid={false}
        />

        {/* 背景クリック用の透明なPlane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1, 0]}
          onClick={handleBackgroundClick}
          renderOrder={-1}
        >
          <planeGeometry args={[workAreaUnits, workAreaUnits]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* 角材を描画 */}
        {Object.values(lumbers).map((lumber) => (
          <Lumber key={lumber.id} lumber={lumber} />
        ))}

        {/* Interactive placement handler */}
        <InteractionHandler />

        {/* カメラコントロール */}
        <RhinoControls />
      </Canvas>
    </div>
  );
}

