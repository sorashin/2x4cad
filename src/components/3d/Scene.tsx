import { useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Raycaster, Plane, Vector3 as ThreeVector3, Vector2 } from 'three';
import { useLumberStore } from '../../stores/lumber';
import { Lumber } from './Lumber';
import { PreviewLumber, DefaultPreviewLumber } from './PreviewLumber';
import { useUIMode } from '../../hooks/useUIMode';
import { unitsToMm } from '../../constants';

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

  const raycaster = useRef(new Raycaster());
  const groundPlane = useRef(new Plane(new ThreeVector3(0, 1, 0), 0));

  // Update mouse position on every frame
  useFrame(({ pointer }) => {
    if (currentMode === 'idle') return;

    // Convert screen coordinates to world coordinates
    raycaster.current.setFromCamera(pointer, camera);
    const intersection = new ThreeVector3();

    if (raycaster.current.ray.intersectPlane(groundPlane.current, intersection)) {
      // Convert from Three.js units to mm
      const positionMm = {
        x: unitsToMm(intersection.x),
        y: unitsToMm(intersection.y),
        z: unitsToMm(intersection.z),
      };
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
    const intersection = new ThreeVector3();

    if (raycaster.current.ray.intersectPlane(groundPlane.current, intersection)) {
      const positionMm = {
        x: unitsToMm(intersection.x),
        y: unitsToMm(intersection.y),
        z: unitsToMm(intersection.z),
      };

      if (currentMode === 'lumber_placing_start') {
        placeStartPoint(positionMm);
      } else if (currentMode === 'lumber_placing_end') {
        placeEndPoint(positionMm);
      }
    }
  }, [currentMode, camera, gl, placeStartPoint, placeEndPoint]);

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
    </>
  );
}

export function Scene() {
  const { lumbers, deselectAll } = useLumberStore();
  const { currentMode, cancelAddLumber } = useUIMode();

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
        camera={{ position: [50, 50, 50], fov: 50 }}
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

        {/* グリッド (1単位 = 100mm = 10cm) */}
        <Grid
          args={[100, 100]}
          cellSize={1}
          cellThickness={1}
          cellColor="#6f6f6f"
          sectionSize={10}
          sectionThickness={1.5}
          sectionColor="#9d4b4b"
          fadeDistance={50}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />

        {/* 背景クリック用の透明なPlane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1, 0]}
          onClick={handleBackgroundClick}
          renderOrder={-1}
        >
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* 角材を描画 */}
        {Object.values(lumbers).map((lumber) => (
          <Lumber key={lumber.id} lumber={lumber} />
        ))}

        {/* Interactive placement handler */}
        <InteractionHandler />

        {/* カメラコントロール */}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

