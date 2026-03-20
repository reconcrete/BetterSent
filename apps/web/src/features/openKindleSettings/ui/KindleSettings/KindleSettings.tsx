import { memo } from "react";
import { Settings } from "lucide-react";

import { Button } from "~/shared/ui";
import { useOpenModal } from "~/entities/modals";

/**
 * Feature component that opens the Kindle Settings modal.
 * The actual modal UI is in widgets/kindleSettingsModal.
 */
export const KindleSettings = memo(() => {
  const openModal = useOpenModal();

  const handleClick = () => {
    openModal("KindleSettingsModal", {});
  };

  return (
    <Button
      variant="ghost"
      className="text-muted-foreground hover:text-foreground"
      aria-label="Kindle Settings"
      onClick={handleClick}
    >
      <Settings className="size-4" />
      Settings
    </Button>
  );
});
