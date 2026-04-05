import { memo } from "react";
import { Eye } from "lucide-react";

import { Button, Tooltip, TooltipTrigger, TooltipContent } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { useOpenModal } from "~/entities/modals";

interface PreviewExtractionProps {
  historyId: string;
}

export const PreviewExtraction = memo<PreviewExtractionProps>(({ historyId }) => {
  const openModal = useOpenModal();
  const analytics = useAnalytics();

  const handleClick = () => {
    analytics.capture("extraction_preview_opened", { historyId });
    openModal("MarkdownPreviewModal", { historyId });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClick}
          aria-label="Preview extraction"
          className="size-6 [&_svg]:size-3"
        >
          <Eye />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Preview extraction</TooltipContent>
    </Tooltip>
  );
});
