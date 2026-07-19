import * as React from "react";
import { Upload } from "lucide-react";

import { cn } from "~/shared/lib";

interface FileDropZoneProps {
  accept?: string;
  isDragging?: boolean;
  onDragOver?: (e: React.DragEvent<HTMLLabelElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLLabelElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLLabelElement>) => void;
  children?: React.ReactNode;
  className?: string;
  description?: string;
  formats?: string;
}

function FileDropZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
  className,
  description = "Drop files here or",
  formats = "PDF, EPUB, DOC, DOCX, TXT, RTF, HTML\nand image files up to 200 MB each",
}: FileDropZoneProps) {
  return (
    <label
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-3.5 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
        isDragging
          ? "border-foreground/30 bg-accent"
          : "border-black/10 hover:border-foreground/20 dark:border-white/10 dark:hover:border-white/20",
        className,
      )}
    >
      <div className="flex items-center justify-center rounded-[14px] bg-black/4 p-3.5 dark:bg-white/4">
        <Upload className="size-[22px] text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-2 items-center">
        <p className="text-sm font-medium text-foreground">
          {description}{" "}
          <span className="text-primary">browse</span>
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
          {formats}
        </p>
      </div>
      {children}
    </label>
  );
}

export { FileDropZone };
