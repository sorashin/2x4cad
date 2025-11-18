import Icon from "./Icon";
import { useUIMode } from "../../hooks/useUIMode";

export function Toolbar() {
  const { currentMode, startAddLumber, cancelAddLumber } = useUIMode();

  const isPlacingMode = currentMode !== 'idle';

  const handleAddLumberClick = () => {
    if (isPlacingMode) {
      cancelAddLumber();
    } else {
      startAddLumber();
    }
  };

  return (
    <div className="fixed top-8 inset-x-0 flex justify-center pointer-events-none">
      <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2 pointer-events-auto shadow-lg">
        <Icon name="react" />
        <button
          onClick={handleAddLumberClick}
          className={`p-2 rounded transition-colors ${
            isPlacingMode
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-700 text-gray-300'
          }`}
          title={isPlacingMode ? 'Cancel placement (Esc)' : 'Add Lumber'}
        >
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
