import { type FC, useState } from "react";
import { FileText, Pencil, X } from "lucide-react";

import { cn } from "~/shared/lib";
import { Input } from "~/shared/ui";

export type PreselectedFileDetails = {
  title: string;
  author: string;
};

interface ChangePreselectedFileProps {
  file: File;
  details: PreselectedFileDetails;
  onDetailsChange: (details: PreselectedFileDetails) => void;
  onRemove: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
};

export const ChangePreselectedFile: FC<ChangePreselectedFileProps> = ({
  file,
  details,
  onDetailsChange,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const displayTitle = details.title.trim() || file.name;

  return (
    <li className="flex flex-col rounded-xl bg-accent/50 px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-foreground">{displayTitle}</p>
          {details.author.trim() && (
            <p className="truncate text-xs text-muted-foreground">by {details.author.trim()}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          aria-label={`Edit book details for ${file.name}`}
          aria-expanded={isEditing}
          className={cn(
            "shrink-0 rounded-md p-0.5 transition-colors",
            isEditing ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Pencil className="size-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div
        inert={!isEditing}
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isEditing ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        {/* -m-1/p-1 keeps the focus ring from being clipped by overflow-hidden */}
        <div className="overflow-hidden -m-1 p-1">
          <div className="flex flex-col gap-2 pt-2.5 pb-1">
            <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
              Book details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder="Book title (Optional)"
                value={details.title}
                onChange={(e) => onDetailsChange({ ...details, title: e.target.value })}
              />
              <Input
                placeholder="Author (Optional)"
                value={details.author}
                onChange={(e) => onDetailsChange({ ...details, author: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};
