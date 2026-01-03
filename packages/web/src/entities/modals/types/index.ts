export type ModalEntry = {
  modalName: ModalName;
  // Stored without closeModal; injected during render phase
  props?: Partial<ModalPropsMap[ModalName]> | unknown;
};

export type ModalState = {
  modals: ModalEntry[];
};

export type ModalsContextValue = {
  modals: ModalEntry[];
  openModal: <T extends ModalName>(modal: T, props: Omit<ModalPropsMap[T], "closeModal">) => void;
  closeModal: () => void;
  closeAllModals: () => void;
};

export type ModalPropsMap = {};

export type ModalPropsBase = {
  closeModal: () => void;
};

export type ModalName = keyof ModalPropsMap;

export type ModalProps<T extends ModalName> = ModalPropsMap[T] & {
  closeModal: () => void;
};

// ------------------------------------------------------------------ //
