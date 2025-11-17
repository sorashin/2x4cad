import { useEffect } from 'react';
import { Scene } from './components/Scene';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLumberStore } from './stores/lumber';
import { LumberType } from './types/lumber';

function App() {
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
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Scene />

      {/* UI オーバーレイ */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          color: 'white',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0' }}>2x4 CAD</h3>
        <p style={{ margin: '5px 0' }}>クリック: 角材を選択</p>
        <p style={{ margin: '5px 0' }}>Shift + クリック: 複数選択</p>
        <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #666' }} />
        <p style={{ margin: '5px 0' }}><strong>T</strong>キー: 移動モード</p>
        <p style={{ margin: '5px 0' }}><strong>R</strong>キー: 回転モード</p>
        <p style={{ margin: '5px 0' }}><strong>E</strong>キー: スケール（伸縮）モード</p>
        <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #666' }} />
        <p style={{ margin: '5px 0' }}>Ctrl/Cmd + Z: 元に戻す</p>
        <p style={{ margin: '5px 0' }}>Ctrl/Cmd + Shift + Z: やり直す</p>
        <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #666' }} />
        <p style={{ margin: '5px 0' }}>マウスドラッグ: カメラ回転</p>
        <p style={{ margin: '5px 0' }}>ホイール: ズーム</p>
      </div>
    </div>
  );
}

export default App;
