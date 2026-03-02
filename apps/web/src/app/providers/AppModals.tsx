import { useModalsStore, type ModalName, type ModalPropsMap } from "~/entities/modals";
import { KindleSettingsModal } from "~/widgets/kindleSettingsModal";
import { MarkdownPreviewModal } from "~/widgets/markdownPreviewModal";

const renderModalByName = (
  modalName: ModalName,
  props: Partial<ModalPropsMap[ModalName]> | undefined,
  handlers: { closeModal: () => void }
) => {
  switch (modalName) {
    case "KindleSettingsModal":
      return (
        <KindleSettingsModal
          {...(props as ModalPropsMap["KindleSettingsModal"])}
          closeModal={handlers.closeModal}
        />
      );
    case "MarkdownPreviewModal":
      return (
        <MarkdownPreviewModal
          {...(props as ModalPropsMap["MarkdownPreviewModal"])}
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
