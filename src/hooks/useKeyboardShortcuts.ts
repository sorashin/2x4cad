import { useEffect } from 'react';
import { useHistoryStore } from '../stores/history';
import { useLumberStore } from '../stores/lumber';
import { DeleteLumberCommand } from '../commands/DeleteLumberCommand';

export function useKeyboardShortcuts() {
  const { undo, redo } = useHistoryStore();
  const { selectedIds } = useLumberStore();

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedIds]);
}
