import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TemplatesModel } from './TemplatesModel';

export function TemplatesCanvas() {
  return (
    <div className="flex-1 absolute top-0 left-0 w-full h-full">
      <Canvas
        camera={{
          position: [20, 20, 20],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
      >
        <color attach="background" args={['#eeeeee']} />

        {/* 照明 */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow={false} />
        <directionalLight position={[-5, 5, 5]} intensity={0.6} castShadow={false} />
        <directionalLight position={[0, 5, -10]} intensity={0.8} castShadow={false} />

        {/* コントロール */}
        <OrbitControls
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          zoomSpeed={0.5}
        />

        {/* モデル */}
        <TemplatesModel />

        {/* グリッド */}
        <gridHelper args={[20, 20]} />
      </Canvas>
    </div>
  );
}
