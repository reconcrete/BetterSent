// ============================================
// Core Type Definitions
// ============================================

/**
 * Map modal names to their props — this is the source of truth.
 * Add new modal types here when creating new modals.
 */
export type ModalPropsMap = {
  KindleSettingsModal: KindleSettingsModalProps;
};

// ============================================
// Modal Props Definitions
// ============================================

export type KindleSettingsModalProps = ModalPropsBase;

/**
 * Union of all modal names derived from ModalPropsMap.
 */
export type ModalName = keyof ModalPropsMap;

/**
 * Base props that every modal receives (injected by AppModals).
 */
export type ModalPropsBase = {
  closeModal: () => void;
};

/**
 * Full props for a specific modal, including the injected closeModal.
 */
export type ModalProps<T extends ModalName> = ModalPropsMap[T] & ModalPropsBase;

// ============================================
// Store Types
// ============================================

/**
 * Entry in the modal stack.
 * Props are stored without closeModal; it's injected during render.
 */
export type ModalEntry = {
  modalName: ModalName;
  props?: Partial<ModalPropsMap[ModalName]> | unknown;
};

/**
 * The immutable state shape for the modals store.
 */
export type ModalState = {
  modals: ModalEntry[];
};

/**
 * Context value shape (for potential Context-based usage).
 */
export type ModalsContextValue = {
  modals: ModalEntry[];
  openModal: <T extends ModalName>(
    modal: T,
    props: Omit<ModalPropsMap[T], "closeModal">,
    options?: { closeOthers?: boolean }
  ) => void;
  closeModal: () => void;
  closeAllModals: () => void;
};

// ============================================
// Example Modal Props (uncomment and modify as needed)
// ============================================

// export type CreateListModalProps = ModalPropsBase;

// export type AddChannelModalProps = ModalPropsBase & {
//   listId: string;
// };

// export type EditListModalProps = ModalPropsBase & {
//   listId: string;
// };

// ------------------------------------------------------------------ //
