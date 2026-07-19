import { type FC } from "react";

import { cn } from "~/shared/lib";
import { Input } from "~/shared/ui";

interface BookDetailsFieldsProps {
  visible: boolean;
  title: string;
  author: string;
  onTitleChange: (title: string) => void;
  onAuthorChange: (author: string) => void;
}

export const BookDetailsFields: FC<BookDetailsFieldsProps> = ({
  visible,
  title,
  author,
  onTitleChange,
  onAuthorChange,
}) => (
  <div
    inert={!visible}
    className={cn(
      "grid transition-all duration-300 ease-in-out",
      visible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 -mt-3",
    )}
  >
    {/* -m-1/p-1 keeps the focus ring from being clipped by overflow-hidden */}
    <div className="overflow-hidden -m-1 p-1">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          Book details
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            placeholder="Book title (Optional)"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <Input
            placeholder="Author (Optional)"
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  </div>
);
