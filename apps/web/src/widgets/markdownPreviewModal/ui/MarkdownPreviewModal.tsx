import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api } from "~/shared/lib/treaty";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "~/shared/ui";
import type { MarkdownPreviewModalProps } from "~/entities/modals/types";

export const MarkdownPreviewModal: FC<MarkdownPreviewModalProps> = ({
  historyId,
  closeModal,
}) => {
  const {
    data: content,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["markdownPreview", historyId],
    queryFn: async () => {
      const response = await api.history({ id: historyId }).preview.get();
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to load preview";
        throw new Error(errorMessage);
      }
      return response.data?.data?.content ?? "";
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Markdown Preview
          </DialogTitle>
          <DialogDescription>
            Preview of the extracted content in markdown format.
          </DialogDescription>
        </DialogHeader>

          {isLoading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {error instanceof Error ? error.message : "Failed to load preview"}
            </p>
          )}

          {content && (
            <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
};
