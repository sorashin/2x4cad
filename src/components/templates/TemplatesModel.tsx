import { Edges } from '@react-three/drei';
import { useModularStore } from '../../stores/templates/modular';
import { mmToUnits } from '../../constants';

export function TemplatesModel() {
  const { geometries } = useModularStore();
  const scale = mmToUnits(1); // 1mm = 1/100 Three.js units

  return (
    <group rotation={[Math.PI/2, 0, 0]} scale={scale}>
      {geometries.map((g, index) => {
        // 法線を再計算
        g.geometry.computeVertexNormals();

        return (
          <mesh key={index} geometry={g.geometry} rotation={[Math.PI, 0, 0]}>
            <meshStandardMaterial color="#d4a373" flatShading={true} />
            <Edges threshold={45} color="#8b5a2b" />
          </mesh>
        );
      })}
    </group>
  );
}
