import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useLumberStore } from '../../stores/lumber';
import { Lumber } from './Lumber';

export function Scene() {
  const { lumbers, deselectAll } = useLumberStore();

  const handleBackgroundClick = () => {
    deselectAll();
  };

  return (
    <div className="w-screen h-screen">
      <Canvas
        camera={{ position: [50, 50, 50], fov: 50 }}
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

        {/* カメラコントロール */}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

