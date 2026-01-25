import { modalsStore, useModals } from "../model";
import type { ModalName } from "../types";

/**
 * Hook to get the openModal function.
 * The store function is a stable reference, so this won't cause re-renders.
 */
export const useOpenModal = () => {
  return modalsStore.openModal;
};

/**
 * Hook to get the closeModal function.
 * The store function is a stable reference, so this won't cause re-renders.
 */
export const useCloseModal = () => {
  return modalsStore.closeModal;
};

/**
 * Hook to get the closeAllModals function.
 * The store function is a stable reference, so this won't cause re-renders.
 */
export const useCloseAllModals = () => {
  return modalsStore.closeAllModals;
};

/**
 * Hook to check if a specific modal is currently open.
 */
export const useIsModalOpen = <T extends ModalName>(modalName: T): boolean => {
  const modals = useModals();
  return modals.some((m) => m.modalName === modalName);
};

/**
 * Hook to get the current top modal (if any).
 */
export const useCurrentModal = () => {
  const modals = useModals();
  return modals.length > 0 ? modals[modals.length - 1] : null;
};

/**
 * Hook to get the modal count.
 */
export const useModalCount = (): number => {
  const modals = useModals();
  return modals.length;
};
