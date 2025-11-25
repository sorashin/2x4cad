import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Raycaster, Plane, Vector3 as ThreeVector3, Vector2, Ray, MOUSE } from 'three';
import type { ComponentRef } from 'react';
import { useLumberStore } from '../../stores/lumber';
import { useSettingsStore } from '../../stores/settings';
import { useInteractionStore } from '../../stores/interaction';
import { Lumber } from './Lumber';
import { PreviewLumber, DefaultPreviewLumber } from './PreviewLumber';
import { HighlightedFace } from './HighlightedFace';
import { useUIMode } from '../../hooks/useUIMode';
import { unitsToMm, mmToUnits } from '../../constants';
import type { Face } from '../../types/lumber';
import { LUMBER_DIMENSIONS } from '../../types/lumber';
import { 
  snapToGrid, 
  findParallelFaces, 
  findClosestParallelFace, 
  snapToFace,
  normalize,
  subtract,
  dot,
  scale,
  distance,
  getLumberFaces,
  calculateRotationFromNormalAndUp,
  getFaceUpVector,
  snapToFaceCenterLine,
  shouldRotate90Degrees,
  rotateQuaternionAroundAxis,
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
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
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
  const { camera, gl, scene } = useThree();
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
  const selectedLumberType = useInteractionStore((s) => s.selectedLumberType);
  const { 
    parallelFaces, 
    activeSnapFace,
    hoveredFaceInfo,
    lockedFaceSnap,
    setParallelFaces, 
    setActiveSnapFace,
    setHoveredFaceInfo,
    setLockedFaceSnap,
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

    // 始点選択モード: 既存Lumberの面検出と頂点スナップ
    if (currentMode === 'lumber_placing_start') {
      // 既存のLumberメッシュとraycast交差をチェック
      const lumberMeshes = scene.children.filter(
        (child) => child.userData?.lumberId && child.type === 'Mesh'
      );
      
      raycaster.current.intersectObjects(lumberMeshes, false);
      const intersects = raycaster.current.intersectObjects(lumberMeshes, false);
      
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const lumberId = intersection.object.userData?.lumberId;
        const lumber = lumberId ? lumbers[lumberId] : null;
        
        if (lumber) {
          // 交差点をmm単位に変換
          const intersectionPointMm = {
            x: unitsToMm(intersection.point.x),
            y: unitsToMm(intersection.point.y),
            z: unitsToMm(intersection.point.z),
          };
          
          // このLumberのすべての面を取得
          const faces = getLumberFaces(lumber);
          
          // 交差点に最も近い面を検出
          let closestFace: { face: Face; distance: number } | null = null;
          for (const face of faces) {
            // 面の中心から交差点への距離を計算
            const dist = distance(intersectionPointMm, face.center);
            // 面の法線方向の距離も考慮（面の平面上にあるかチェック）
            const normalAxis = Math.abs(face.normal.x) > 0.9 ? 'x' 
                             : Math.abs(face.normal.y) > 0.9 ? 'y' 
                             : 'z';
            const facePos = normalAxis === 'x' ? face.center.x
                          : normalAxis === 'y' ? face.center.y
                          : face.center.z;
            const pointPos = normalAxis === 'x' ? intersectionPointMm.x
                           : normalAxis === 'y' ? intersectionPointMm.y
                           : intersectionPointMm.z;
            const planeDist = Math.abs(pointPos - facePos);
            
            // 面の平面上に近い場合のみ考慮
            if (planeDist < 50) { // 50mm以内
              if (!closestFace || dist < closestFace.distance) {
                closestFace = { face, distance: dist };
              }
            }
          }
          
          if (closestFace) {
            const targetFace = closestFace.face;
            
            // 面の法線方向を決定（カメラの手前側）
            const cameraPos = {
              x: unitsToMm(camera.position.x),
              y: unitsToMm(camera.position.y),
              z: unitsToMm(camera.position.z),
            };
            const faceToCamera = subtract(cameraPos, targetFace.center);
            const normalDot = dot(targetFace.normal, normalize(faceToCamera));
            
            // 法線がカメラ方向を向いている場合は反転
            const faceNormal = normalDot > 0 ? targetFace.normal : scale(targetFace.normal, -1);
            
            // 面のupベクトルを取得（角を合わせるため）
            const faceUp = getFaceUpVector(targetFace);
            
            // 回転を計算
            const baseRotation = calculateRotationFromNormalAndUp(faceNormal, faceUp);
            
            // edge位置一致判定と自動90度回転
            const previewDimensions = LUMBER_DIMENSIONS[selectedLumberType];
            const needsRotation = shouldRotate90Degrees(
              previewDimensions, 
              targetFace, 
              intersectionPointMm, 
              baseRotation
            );
            
            let rotation = baseRotation;
            if (needsRotation) {
              // 長手方向（faceNormal）を軸に90度回転
              rotation = rotateQuaternionAroundAxis(baseRotation, normalize(faceNormal));
            }
            
            // 面情報を保存
            setHoveredFaceInfo({
              face: targetFace,
              lumberId: lumber.id,
              normal: faceNormal,
              rotation,
              faceType: targetFace.faceType,
              isRotated90: needsRotation,
            });
            
            // 面スナップがアクティブな場合: 中心線スナップを適用
            const finalPosition = snapToFaceCenterLine(intersectionPointMm, targetFace);
            
            setCurrentMousePosition(clampToWorkArea(finalPosition));
          } else {
            // 面が見つからない場合は通常の処理
            setHoveredFaceInfo(null);
            
            const groundPlane = new Plane(new ThreeVector3(0, 1, 0), 0);
            const intersection = new ThreeVector3();
            if (raycaster.current.ray.intersectPlane(groundPlane, intersection)) {
              let positionMm = clampToWorkArea({
                x: unitsToMm(intersection.x),
                y: unitsToMm(intersection.y),
                z: unitsToMm(intersection.z),
              });
              
              if (snapToGridEnabled) {
                positionMm = snapToGrid(positionMm, gridSize);
              }
              
              setCurrentMousePosition(positionMm);
            }
          }
        } else {
          setHoveredFaceInfo(null);
          
          const groundPlane = new Plane(new ThreeVector3(0, 1, 0), 0);
          const intersection = new ThreeVector3();
          if (raycaster.current.ray.intersectPlane(groundPlane, intersection)) {
            let positionMm = clampToWorkArea({
              x: unitsToMm(intersection.x),
              y: unitsToMm(intersection.y),
              z: unitsToMm(intersection.z),
            });
            
            if (snapToGridEnabled) {
              positionMm = snapToGrid(positionMm, gridSize);
            }
            
            setCurrentMousePosition(positionMm);
          }
        }
      } else {
        // 交差がない場合は通常の処理
        setHoveredFaceInfo(null);
        
        const groundPlane = new Plane(new ThreeVector3(0, 1, 0), 0);
        const intersection = new ThreeVector3();
        if (raycaster.current.ray.intersectPlane(groundPlane, intersection)) {
          let positionMm = clampToWorkArea({
            x: unitsToMm(intersection.x),
            y: unitsToMm(intersection.y),
            z: unitsToMm(intersection.z),
          });
          
          if (snapToGridEnabled) {
            positionMm = snapToGrid(positionMm, gridSize);
          }
          
          setCurrentMousePosition(positionMm);
        }
      }
    } else {
      // 終点選択モード: 既存の処理 + 方向ロック
      const useStartPoint = currentMode === 'lumber_placing_end' ? startPoint : null;
      const intersection = getAxisIntersection(raycaster.current, useStartPoint);

      if (intersection) {
        // Convert from Three.js units to mm and clamp to work area
        let positionMm = clampToWorkArea({
          x: unitsToMm(intersection.x),
          y: unitsToMm(intersection.y),
          z: unitsToMm(intersection.z),
        });
        
        // 方向ロックが有効な場合
        if (lockedFaceSnap) {
          // 始点から法線方向に沿った直線上に終点を制限
          const direction = lockedFaceSnap.normal;
          const startToEnd = subtract(positionMm, startPoint!);
          const projectedLength = dot(startToEnd, direction);
          
          // 法線方向に沿った位置を計算
          positionMm = {
            x: startPoint!.x + direction.x * projectedLength,
            y: startPoint!.y + direction.y * projectedLength,
            z: startPoint!.z + direction.z * projectedLength,
          };
          
          // グリッドスナップ（法線方向の長さのみ）
          if (snapToGridEnabled) {
            const snappedLength = Math.round(projectedLength / gridSize) * gridSize;
            positionMm = {
              x: startPoint!.x + direction.x * snappedLength,
              y: startPoint!.y + direction.y * snappedLength,
              z: startPoint!.z + direction.z * snappedLength,
            };
          }
        } else {
          // 通常の処理
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
        }
        
        setCurrentMousePosition(positionMm);
      }
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

    if (currentMode === 'lumber_placing_start') {
      // 始点選択時: hoveredFaceInfoがあればlockedFaceSnapに保存
      if (hoveredFaceInfo) {
        setLockedFaceSnap(hoveredFaceInfo);
      }
      
      // 現在のマウス位置を使用（useFrameで既に計算済み）
      if (currentMousePosition) {
        placeStartPoint(currentMousePosition);
      }
    } else if (currentMode === 'lumber_placing_end') {
      // 終点選択時: 既存の処理
      const useStartPoint = startPoint;
      const intersection = getAxisIntersection(raycaster.current, useStartPoint);

      if (intersection) {
        let positionMm = clampToWorkArea({
          x: unitsToMm(intersection.x),
          y: unitsToMm(intersection.y),
          z: unitsToMm(intersection.z),
        });

        // 方向ロックが有効な場合
        if (lockedFaceSnap && startPoint) {
          const direction = lockedFaceSnap.normal;
          const startToEnd = subtract(positionMm, startPoint);
          const projectedLength = dot(startToEnd, direction);
          
          positionMm = {
            x: startPoint.x + direction.x * projectedLength,
            y: startPoint.y + direction.y * projectedLength,
            z: startPoint.z + direction.z * projectedLength,
          };
          
          if (snapToGridEnabled) {
            const snappedLength = Math.round(projectedLength / gridSize) * gridSize;
            positionMm = {
              x: startPoint.x + direction.x * snappedLength,
              y: startPoint.y + direction.y * snappedLength,
              z: startPoint.z + direction.z * snappedLength,
            };
          }
        } else {
          // 通常の処理
          if (snapToGridEnabled) {
            positionMm = snapToGrid(positionMm, gridSize);
          }

          if (parallelFaces.length > 0) {
            const closestFace = findClosestParallelFace(positionMm, parallelFaces, faceSnapThreshold);
            
            if (closestFace) {
              positionMm = snapToFace(positionMm, closestFace);
            }
          }
        }

        placeEndPoint(positionMm);
      }
    }
  }, [currentMode, camera, gl, startPoint, currentMousePosition, hoveredFaceInfo, lockedFaceSnap, placeStartPoint, placeEndPoint, clampToWorkArea, snapToGridEnabled, gridSize, parallelFaces, faceSnapThreshold, setLockedFaceSnap]);

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
      
      {/* 始点選択時: ホバー中の面をハイライト表示 */}
      {currentMode === 'lumber_placing_start' && hoveredFaceInfo && (
        <HighlightedFace 
          face={hoveredFaceInfo.face}
          isActive={true}
        />
      )}
      
      {/* 終点選択時: 平行な面をハイライト表示 */}
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

