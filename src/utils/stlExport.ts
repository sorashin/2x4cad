import { Mesh, MeshBasicMaterial, Scene } from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import type { BoardGeometryWithId } from '../stores/templates/modular';

/**
 * boardGeometries をまとめて1つのSTLファイルとしてダウンロードする
 */
export function exportBoardGeometriesAsSTL(
  boardGeometries: BoardGeometryWithId[],
  filename = 'model.stl'
): void {
  if (boardGeometries.length === 0) return;

  const scene = new Scene();
  const material = new MeshBasicMaterial();

  for (const bg of boardGeometries) {
    const geo = bg.geometry.clone();
    // 座標はmm単位のままエクスポート（スライサーでmm指定すればそのまま使える）
    const mesh = new Mesh(geo, material);
    scene.add(mesh);
  }

  const exporter = new STLExporter();
  const stlBinary = exporter.parse(scene, { binary: true });

  const blob = new Blob([stlBinary], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  material.dispose();
}
