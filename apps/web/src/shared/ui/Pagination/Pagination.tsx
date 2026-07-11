import type { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "~/shared/lib";
import { Button } from "../Button/Button";

const MAX_VISIBLE_PAGES = 7;

/** Page numbers to render: first, last, the ones around the current page, and "…" for the gaps. */
const getPageItems = (page: number, totalPages: number): (number | "ellipsis")[] => {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const around = [page - 1, page, page + 1].filter((p) => p > 1 && p < totalPages);
  const items: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const current of [1, ...around, totalPages]) {
    if (current - previous > 1) items.push("ellipsis");
    items.push(current);
    previous = current;
  }

  return items;
};

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export const Pagination: FC<PaginationProps> = ({ page, totalPages, onPageChange, className }) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft />
      </Button>

      {getPageItems(page, totalPages).map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            aria-hidden
            className="flex items-center justify-center size-8 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? "default" : "ghost"}
            size="icon-sm"
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight />
      </Button>
    </nav>
  );
};
