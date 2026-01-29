import { Link } from 'react-router-dom';
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
        <div className="w-px h-6 bg-gray-600" />
        <Link
          to="/templates/raisedbed"
          className="p-2 rounded hover:bg-gray-700 text-gray-300 transition-colors"
          title="Open Templates"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
