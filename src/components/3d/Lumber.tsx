import { useRef, useMemo } from 'react';
import { Mesh, Quaternion as ThreeQuaternion, Vector3 as ThreeVector3, Color, ShaderMaterial } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import type { Lumber as LumberType } from '../../types/lumber';
import { LUMBER_DIMENSIONS } from '../../types/lumber';
import { useLumberStore } from '../../stores/lumber';
import { mmToUnits } from '../../constants';
import { LumberTransformControls } from './LumberTransformControls';

interface LumberProps {
  lumber: LumberType;
}

export function Lumber({ lumber }: LumberProps) {
  const meshRef = useRef<Mesh>(null);
  const { selectLumber, deselectAll, selectedIds } = useLumberStore();

  const isSelected = selectedIds.has(lumber.id);

  // 木目シェーダーの固定パラメータ
  const lightGrainColor = '#eeb977';
  const darkGrainColor = '#8B4513';
  const ringDensity = 20.0;
  const grainFrequency = 8.0;
  const noiseStrength = 0.0;
  const ringGrainMix = 0.6;
  const noiseMix = 0.3;
  const ringOffset = 0.0;

  // 木目シェーダーマテリアルを作成
  // 参考: Blenderのプロシージャル木目テクスチャ
  // https://www.youtube.com/watch?v=n7e0vxgBS8A
  const woodMaterial = useMemo(() => {
    // lumber.idからハッシュを生成してランダムなオフセットを取得
    const hash = lumber.id.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const offset = (Math.abs(hash) % 1000) / 1000;
    
    // 木目のベースカラー
    const lightColor = new Color(lightGrainColor);
    const darkColor = new Color(darkGrainColor);
    
    // 選択時は少し明るくする
    if (isSelected) {
      lightColor.multiplyScalar(1.2);
      darkColor.multiplyScalar(1.1);
    }
    
    const material = new ShaderMaterial({
      uniforms: {
        lightGrainColor: { value: lightColor },
        darkGrainColor: { value: darkColor },
        time: { value: 0 },
        offset: { value: offset },
        ringDensity: { value: ringDensity },
        grainFrequency: { value: grainFrequency },
        noiseStrength: { value: noiseStrength },
        ringGrainMix: { value: ringGrainMix },
        noiseMix: { value: noiseMix },
        ringOffset: { value: ringOffset },
        roughness: { value: 0.96 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 lightGrainColor;
        uniform vec3 darkGrainColor;
        uniform float time;
        uniform float offset;
        uniform float ringDensity;
        uniform float grainFrequency;
        uniform float noiseStrength;
        uniform float ringGrainMix;
        uniform float noiseMix;
        uniform float ringOffset;
        uniform float roughness;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        // ノイズ関数
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        // 滑らかなノイズ
        float smoothNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }
        
        // フラクタルノイズ
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 4; i++) {
            value += amplitude * smoothNoise(p);
            p *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        void main() {
          // UV座標を調整（木目の方向に合わせる）
          vec2 uv = vUv;
          
          // 法線のY成分をチェックして、小口面（端面）かどうかを判定
          // 小口面はY軸方向の面なので、abs(vNormal.y)が大きい（0.9以上）
          float isEndFace = step(0.9, abs(vNormal.y));
          
          // 年輪のリングパターン（中心からの距離）
          vec2 center = vec2(0.5, 0.5);
          float dist = length(uv - center);
          
          // 年輪のリング（パラメータで調整可能）
          // 小口面の場合のみリングを適用
          float rings = sin(dist * ringDensity + offset * 10.0 + ringOffset) * 0.5 + 0.5;
          rings = pow(rings, 2.0);
          rings = mix(0.5, rings, isEndFace); // 小口面以外ではリングを無効化（0.5で均一に）
          
          // 木目の縦方向のストライプ（Y軸方向、パラメータで調整可能）
          float grain = sin(uv.y * grainFrequency + fbm(uv * 5.0) * noiseStrength) * 0.5 + 0.5;
          grain = pow(grain, 3.0);
          
          // ノイズによるバリエーション
          float n = fbm(uv * 10.0 + offset);
          
          // 木目のパターンを組み合わせ（パラメータで調整可能）
          // 小口面の場合はリングとストライプを混合、それ以外はストライプのみ
          float pattern = mix(rings, grain, ringGrainMix);
          pattern = mix(pattern, n, noiseMix);
          
          // 色を混合（明るい部分と暗い部分）
          vec3 color = mix(darkGrainColor, lightGrainColor, pattern);
          
          // 最終的な色
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
    
    return material;
  }, [lumber.id, isSelected]);

  // 角材の寸法を取得
  const dimensions = LUMBER_DIMENSIONS[lumber.type];

  // クォータニオンをThree.jsのQuaternionに変換
  const quaternion = new ThreeQuaternion(
    lumber.rotation.x,
    lumber.rotation.y,
    lumber.rotation.z,
    lumber.rotation.w
  );

  // 位置をThree.jsのVector3に変換（mm → Three.js単位）
  const position = new ThreeVector3(
    mmToUnits(lumber.position.x),
    mmToUnits(lumber.position.y),
    mmToUnits(lumber.position.z)
  );

  // 角材の中心に配置するため、長さの半分だけオフセット
  // 回転後の方向に沿ってオフセットを適用
  const direction = new ThreeVector3(0, 1, 0).applyQuaternion(quaternion);
  const centerOffset = direction.multiplyScalar(mmToUnits(lumber.length) / 2);
  const centerPosition = position.clone().add(centerOffset);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();

    if (event.shiftKey) {
      // Shift + クリック: 複数選択
      selectLumber(lumber.id, true);
    } else {
      // 通常クリック: 単一選択
      deselectAll();
      selectLumber(lumber.id, false);
    }
  };

  return (
    <>
      <mesh
        ref={meshRef}
        position={centerPosition}
        quaternion={quaternion}
        onClick={handleClick}
      >
        <boxGeometry
          args={[
            mmToUnits(dimensions.width),
            mmToUnits(lumber.length),
            mmToUnits(dimensions.height),
          ]}
        />
        <primitive object={woodMaterial} attach="material" />
        {/* 選択時に輪郭線を表示 */}
        {isSelected && (
          <Edges
            scale={1}
            threshold={15}
            color="#00ff00"
            linewidth={3}
          />
        )}
      </mesh>

      {/* 選択時にTransformControlsを表示 */}
      {isSelected && (
        <LumberTransformControls lumberId={lumber.id} meshRef={meshRef} />
      )}
    </>
  );
}

