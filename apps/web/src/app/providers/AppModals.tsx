import { useModalsStore, type ModalName, type ModalPropsMap } from "~/entities/modals";
import { MarkdownPreviewModal } from "~/widgets/markdownPreviewModal";
import { ReferencesModal } from "~/widgets/referencesModal";

const renderModalByName = (
  modalName: ModalName,
  props: Partial<ModalPropsMap[ModalName]> | undefined,
  handlers: { closeModal: () => void }
) => {
  switch (modalName) {
    case "MarkdownPreviewModal":
      return (
        <MarkdownPreviewModal
          {...(props as ModalPropsMap["MarkdownPreviewModal"])}
          closeModal={handlers.closeModal}
        />
      );
    case "ReferencesModal":
      return (
        <ReferencesModal
          {...(props as ModalPropsMap["ReferencesModal"])}
          closeModal={handlers.closeModal}
        />
      );
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
