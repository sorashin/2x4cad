
import Icon from "./Icon";


export function Toolbar() {
  

  return (
    <div className="fixed top-8 inset-x-0 flex justify-center bg-surface-sheet-h rounded-sm p-2">
      <Icon name="react" />
      <button className="text-content-h-a">
        <Icon name="plus" />
      </button>
    </div>
  );
}
