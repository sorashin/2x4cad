import { useGLTF } from '@react-three/drei';
import { useRaisedBedStore } from '../../stores/templates/raisedBed';

const CASTER_GLB_PATH = '/models/caster.glb';
const CASTER_SCALE = 1;
const CASTER_INSET = 17.5; // post(35mm角)の半分
const CASTER_Z_OFFSET = 110;

/** 4隅のキャスター配置を計算（mm単位） */
function useCasterPositions(): [number, number, number][] {
  const { width, depth } = useRaisedBedStore();
  const hw = width / 2 - CASTER_INSET;
  const hd = depth / 2 - CASTER_INSET;
  return [
    [-hw, -hd, CASTER_Z_OFFSET],
    [hw, -hd, CASTER_Z_OFFSET],
    [-hw, hd, CASTER_Z_OFFSET],
    [hw, hd, CASTER_Z_OFFSET],
  ];
}

export function CasterModel() {
  const { scene } = useGLTF(CASTER_GLB_PATH);
  const positions = useCasterPositions();

  return (
    <>
      {positions.map((pos, i) => (
        <primitive
          key={i}
          object={scene.clone()}
          position={pos}
          rotation={[-Math.PI / 2, Math.PI / 2, 0]}  
          scale={CASTER_SCALE}
        />
      ))}
    </>
  );
}

useGLTF.preload(CASTER_GLB_PATH);
