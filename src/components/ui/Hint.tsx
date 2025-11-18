export function Hint() {
  return (
    <>
    {/* UI オーバーレイ */}
    <div className="absolute bottom-[10px] left-[10px] text-white bg-black/70 p-[10px] rounded-[5px] font-mono text-xs">
        <h3 className="m-0 mb-[10px]">2x4 CAD</h3>
        <p className="my-[5px]">クリック: 角材を選択</p>
        <p className="my-[5px]">Shift + クリック: 複数選択</p>
        <hr className="my-[10px] border-0 border-t border-solid border-[#666]" />
        <p className="my-[5px]"><strong>T</strong>キー: 移動モード</p>
        <p className="my-[5px]"><strong>R</strong>キー: 回転モード</p>
        <p className="my-[5px]"><strong>E</strong>キー: スケール（伸縮）モード</p>
        <hr className="my-[10px] border-0 border-t border-solid border-[#666]" />
        <p className="my-[5px]">Ctrl/Cmd + Z: 元に戻す</p>
        <p className="my-[5px]">Ctrl/Cmd + Shift + Z: やり直す</p>
        <hr className="my-[10px] border-0 border-t border-solid border-[#666]" />
        <p className="my-[5px]">マウスドラッグ: カメラ回転</p>
        <p className="my-[5px]">ホイール: ズーム</p>
      </div></>
  );
}