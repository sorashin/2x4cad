import { useMemo } from 'react';
import { Vector3 as ThreeVector3, BufferGeometry, Float32BufferAttribute, EdgesGeometry, LineBasicMaterial } from 'three';
import type { Face } from '../../types/lumber';
import { mmToUnits } from '../../constants';

interface HighlightedFaceProps {
  face: Face;
  isActive: boolean; // スナップ中の面かどうか
}

/**
 * 平行な面を輪郭線でハイライト表示するコンポーネント
 * isActive が true の場合は、スナップ対象として異なる色で表示
 * 輪郭線は他のオブジェクトがあっても常に見えるようにする
 */
export function HighlightedFace({ face, isActive }: HighlightedFaceProps) {
  // 面のジオメトリを作成（輪郭線用）
  const edgesGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    
    // 頂点を Three.js 単位に変換
    const vertices = face.vertices.map(v => new ThreeVector3(
      mmToUnits(v.x),
      mmToUnits(v.y),
      mmToUnits(v.z)
    ));
    
    // 四角形を2つの三角形に分割
    // 頂点順序: 0-1-2, 0-2-3
    const positions = new Float32Array([
      vertices[0].x, vertices[0].y, vertices[0].z,
      vertices[1].x, vertices[1].y, vertices[1].z,
      vertices[2].x, vertices[2].y, vertices[2].z,
      
      vertices[0].x, vertices[0].y, vertices[0].z,
      vertices[2].x, vertices[2].y, vertices[2].z,
      vertices[3].x, vertices[3].y, vertices[3].z,
    ]);
    
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    
    // 輪郭線用のジオメトリを作成
    return new EdgesGeometry(geo, 0.01);
  }, [face.vertices]);
  
  // 色設定
  // isActive: スナップ対象の面 → 明るい緑
  // それ以外: 平行な面の候補 → 薄い青
  const edgeColor = isActive ? '#00FF00' : '#4488FF';
  const lineMaterial = useMemo(() => {
    return new LineBasicMaterial({
      color: edgeColor,
      linewidth: isActive ? 3 : 2,
      depthTest: false, // 常に見えるようにする
      depthWrite: false,
    });
  }, [edgeColor, isActive]);
  
  // React Three Fiberでは小文字の要素名を使う
  return (
    <lineSegments 
      geometry={edgesGeometry} 
      material={lineMaterial}
      renderOrder={1000}
    />
  );
}

