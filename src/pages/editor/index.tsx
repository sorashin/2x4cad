import { useEffect } from 'react';
import { Scene } from '../../components/3d/Scene';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useLumberStore } from '../../stores/lumber';
import { LumberType } from '../../types/lumber';
import { Toolbar } from '../../components/ui/Toolbar';
import { UIMachineProvider } from '../../contexts/UIMachineContext';

export function EditorPage() {
  // キーボードショートカット（Ctrl+Z / Ctrl+Shift+Z）を有効化
  useKeyboardShortcuts();

  const { addLumber } = useLumberStore();

  // 初期化: サンプル角材を配置
  useEffect(() => {
    // 2x4材を配置（縦）
    addLumber(
      LumberType.TWO_BY_FOUR,
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1000, z: 0 }
    );

    // 2x4材を配置（横）
    addLumber(
      LumberType.TWO_BY_FOUR,
      { x: -300, y: 500, z: 0 },
      { x: 300, y: 500, z: 0 }
    );

    // 1x4材を配置
    addLumber(
      LumberType.ONE_BY_FOUR,
      { x: 200, y: 0, z: 200 },
      { x: 200, y: 800, z: 200 }
    );
  }, [addLumber]);

  return (
    <UIMachineProvider>
      <div className="w-screen h-screen m-0 p-0">
        <Scene />
        <Toolbar />
      </div>
    </UIMachineProvider>
  );
}
