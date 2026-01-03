import { create } from "zustand";
import type { ModalEntry, ModalName, ModalPropsMap } from "../types";

export type ModalsStore = {
  modals: ModalEntry[];
  openModal: <T extends ModalName>(
    modal: T,
    props: Omit<ModalPropsMap[T], "closeModal">,
    options?: { closeOthers?: boolean }
  ) => void;
  closeModal: () => void;
  closeAllModals: () => void;
};

export const useModalsStore = create<ModalsStore>((set) => ({
  modals: [],
  openModal: (modal, props, options = { closeOthers: false }) => {
    set((state) => ({
      modals: options.closeOthers ? [{ modalName: modal, props }] : [...state.modals, { modalName: modal, props }],
    }));
  },
  closeModal: () => {
    set((state) => ({
      modals: state.modals.slice(0, -1),
    }));
  },
  closeAllModals: () => {
    set({ modals: [] });
  },
}));
