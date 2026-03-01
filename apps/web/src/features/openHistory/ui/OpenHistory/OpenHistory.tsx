import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { History } from "lucide-react";

import { Button } from "~/shared/ui";

/**
 * Feature component that navigates to the History page.
 */
export const OpenHistory = memo(() => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/history");
  };

  return (
    <Button
      variant="ghost"
      className="text-neutral-500 hover:text-black"
      aria-label="View History"
      onClick={handleClick}
    >
      <History className="size-4" />
      History
    </Button>
  );
});
