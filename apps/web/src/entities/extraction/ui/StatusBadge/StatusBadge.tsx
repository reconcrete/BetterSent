import type { FC } from "react";
import { Clock, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "~/shared/ui";

type ExtractionStatus = "pending" | "processing" | "completed" | "error";

interface StatusBadgeProps {
  status: ExtractionStatus;
  errorMessage?: string | null;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-muted text-muted-foreground hover:bg-muted",
  },
  processing: {
    icon: Loader2,
    label: "Processing",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950",
  },
  completed: {
    icon: CheckCircle2,
    label: "Completed",
    className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950",
  },
  error: {
    icon: XCircle,
    label: "Error",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  },
} as const;

export const StatusBadge: FC<StatusBadgeProps> = ({ status, errorMessage }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="group relative inline-block">
      <Badge variant="secondary" className={`gap-1.5 ${config.className}`}>
        <Icon className={`size-3 ${status === "processing" ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
      {status === "error" && errorMessage && (
        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 p-2 text-xs bg-foreground text-background rounded-lg shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
