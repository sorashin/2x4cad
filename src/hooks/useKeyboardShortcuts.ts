import { useEffect } from 'react';
import { useHistoryStore } from '../stores/history';
import { useLumberStore } from '../stores/lumber';
import { useSettingsStore } from '../stores/settings';
import { DeleteLumberCommand } from '../commands/DeleteLumberCommand';

export function useKeyboardShortcuts() {
  const { undo, redo } = useHistoryStore();
  const { selectedIds } = useLumberStore();
  const { cycleGridSize } = useSettingsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      } else if (ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected lumbers
        if (selectedIds.size > 0) {
          e.preventDefault();
          const command = new DeleteLumberCommand(Array.from(selectedIds));
          command.execute();
        }
      } else if (e.key.toLowerCase() === 'g' && !ctrlKey && !e.shiftKey) {
        // Gキーでグリッドサイズを切り替え（100 → 10 → 1 → 100...）
        e.preventDefault();
        cycleGridSize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedIds, cycleGridSize]);
}
