import { memo } from "react";
import { Link } from "lucide-react";

import { Button, Tooltip, TooltipTrigger, TooltipContent } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { useOpenModal } from "~/entities/modals";

interface ViewReferencesProps {
  references: { url: string; title: string | null }[];
}

export const ViewReferences = memo<ViewReferencesProps>(({ references }) => {
  const openModal = useOpenModal();
  const analytics = useAnalytics();

  const handleClick = () => {
    analytics.capture("references_opened");
    openModal("ReferencesModal", { references });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClick}
          aria-label="View references"
          className="size-6 [&_svg]:size-3"
        >
          <Link />
        </Button>
      </TooltipTrigger>
      <TooltipContent>References</TooltipContent>
    </Tooltip>
  );
});
