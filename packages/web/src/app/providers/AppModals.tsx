import { useModalsStore, type ModalName, type ModalPropsMap } from "~/entities/modals";

const renderModalByName = (
  modalName: ModalName,
  props: Partial<ModalPropsMap[ModalName]> | undefined,
  handlers: { closeModal: () => void }
) => {
  switch (modalName) {
    default:
      return null;
  }
};

export const AppModals = () => {
  const { modals, closeModal } = useModalsStore();

  if (modals.length === 0) return null;

  return modals.map((modal, index) => {
    return (
      <div key={`${modal.modalName}-${index}`}>
        {renderModalByName(modal.modalName, modal.props as Partial<ModalPropsMap[typeof modal.modalName]>, {
          closeModal,
        })}
      </div>
    );
  });
};
