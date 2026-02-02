import { create } from 'zustand';

interface DialogState {
    isOpen: boolean;
    type: '' | 'dimensions';
  }

interface UIStoreState {
  
    dialog: DialogState;
    openDialog: (type: DialogState['type']) => void;
    closeDialog: () => void;
}

export const useUIStore = create<UIStoreState>()((set) => ({
  dialog: {
    isOpen: false,
    type: '',
  },
  openDialog: (type) => set({ dialog: { isOpen: true, type } }),
  closeDialog: () => set({ dialog: { isOpen: false, type: '' } }),
}));
