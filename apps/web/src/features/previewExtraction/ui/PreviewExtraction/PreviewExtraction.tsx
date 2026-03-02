import { memo } from "react";
import { Eye } from "lucide-react";

import { Button } from "~/shared/ui";
import { useOpenModal } from "~/entities/modals";

interface PreviewExtractionProps {
  historyId: string;
}

export const PreviewExtraction = memo<PreviewExtractionProps>(({ historyId }) => {
  const openModal = useOpenModal();

  const handleClick = () => {
    openModal("MarkdownPreviewModal", { historyId });
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleClick}
      title="Preview markdown"
      aria-label="Preview markdown"
    >
      <Eye className="size-4" />
    </Button>
  );
});
