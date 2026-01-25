import { useSyncExternalStore } from "react";
import type { ModalEntry, ModalName, ModalPropsMap, ModalState } from "../types";

// ============================================
// External Store Implementation
// ============================================

type Listener = () => void;

const createModalsStore = () => {
  let state: ModalState = { modals: [] };
  const listeners = new Set<Listener>();

  const getSnapshot = (): ModalState => state;

  const getServerSnapshot = (): ModalState => ({ modals: [] });

  const subscribe = (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const emitChange = () => {
    listeners.forEach((listener) => listener());
  };

  const openModal = <T extends ModalName>(
    modal: T,
    props: Omit<ModalPropsMap[T], "closeModal">,
    options: { closeOthers?: boolean } = { closeOthers: false }
  ) => {
    const newEntry: ModalEntry = { modalName: modal, props };
    state = {
      modals: options.closeOthers ? [newEntry] : [...state.modals, newEntry],
    };
    emitChange();
  };

  const closeModal = () => {
    state = {
      modals: state.modals.slice(0, -1),
    };
    emitChange();
  };

  const closeAllModals = () => {
    state = { modals: [] };
    emitChange();
  };

  return {
    getSnapshot,
    getServerSnapshot,
    subscribe,
    openModal,
    closeModal,
    closeAllModals,
  };
};

// Singleton store instance
export const modalsStore = createModalsStore();

// ============================================
// React Hooks
// ============================================

/**
 * Hook to access the full modals state.
 * Re-renders when any modal is opened or closed.
 */
export const useModalsState = (): ModalState => {
  return useSyncExternalStore(
    modalsStore.subscribe,
    modalsStore.getSnapshot,
    modalsStore.getServerSnapshot
  );
};

/**
 * Hook to get just the modals array.
 * Re-renders when modals change.
 */
export const useModals = (): ModalEntry[] => {
  const state = useModalsState();
  return state.modals;
};

/**
 * Hook to access all modal store actions and state.
 * This provides a similar API to the previous Zustand store.
 */
export const useModalsStore = () => {
  const state = useModalsState();

  // Store functions are stable references, no need for useCallback
  return {
    modals: state.modals,
    openModal: modalsStore.openModal,
    closeModal: modalsStore.closeModal,
    closeAllModals: modalsStore.closeAllModals,
  };
};

// ============================================
// Direct Store Access (for imperative usage outside React)
// ============================================

export const openModal = modalsStore.openModal;
export const closeModal = modalsStore.closeModal;
export const closeAllModals = modalsStore.closeAllModals;
