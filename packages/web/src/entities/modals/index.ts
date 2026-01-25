// Hooks
export {
  useOpenModal,
  useCloseModal,
  useCloseAllModals,
  useIsModalOpen,
  useCurrentModal,
  useModalCount,
} from "./selectors";
export { useModalsStore, useModals, useModalsState } from "./model";

// Direct store access (for imperative usage outside React)
export { openModal, closeModal, closeAllModals, modalsStore } from "./model";

// Types
export type { ModalName, ModalProps, ModalPropsMap, ModalEntry, ModalState } from "./types";
export type { ModalsContextValue } from "./types";
