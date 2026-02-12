import { create } from 'zustand';

interface DialogState {
    isOpen: boolean;
    type: '' | 'dimensions';
  }

interface UIStoreState {

    dialog: DialogState;
    openDialog: (type: DialogState['type']) => void;
    closeDialog: () => void;
    leftMenuWidth: number;
    setLeftMenuWidth: (width: number) => void;
    bom: number;
    updateBom: (bom: number) => void;
    drawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStoreState>()((set) => ({
  dialog: {
    isOpen: false,
    type: '',
  },
  openDialog: (type) => set({ dialog: { isOpen: true, type } }),
  closeDialog: () => set({ dialog: { isOpen: false, type: '' } }),
  leftMenuWidth: 320,
  setLeftMenuWidth: (width) => set({ leftMenuWidth: width }),
  bom: 0,
  updateBom: (bom) => set({ bom }),
  drawerOpen: false,
  setDrawerOpen: (open) => set({ drawerOpen: open }),
}));
