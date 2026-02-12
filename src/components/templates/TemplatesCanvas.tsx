import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { TemplatesModel } from './TemplatesModel';
import { useUIStore } from '../../stores/templates/ui';

export function TemplatesCanvas() {
  const { bom, updateBom } = useUIStore();

  return (
    <div className="flex-1 absolute top-0 left-0 w-full h-full">
      {/* BOM Explosion Slider */}
      <div className="absolute right-8 bottom-8 z-10">
        <div className="bg-white/80 backdrop-blur-sm border border-neutral-300 rounded-lg px-4 py-3 shadow-lg">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-content-h">
              Explode
            </span>
            <div className="relative w-32 h-6 flex items-center">
              <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                <div className="w-full h-[2px] bg-neutral-300 rounded-full" />
                <div
                  className="absolute h-[2px] bg-content-h rounded-full transition-all duration-75"
                  style={{ width: `${bom * 100}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={bom}
                onChange={(e) => updateBom(parseFloat(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="absolute w-3 h-3 bg-content-h rounded-full shadow-lg pointer-events-none transition-all duration-75 border-2 border-white"
                style={{ left: `calc(${bom * 100}% - 6px)` }}
              />
            </div>
            <span className="text-xs font-mono text-content-h w-8 text-right tabular-nums">
              {Math.round(bom * 100)}%
            </span>
          </div>
        </div>
      </div>

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
