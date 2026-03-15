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
          <DialogTitle className="text-xl font-bold text-black">
            Markdown Preview
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            Preview of the extracted content in markdown format.
          </DialogDescription>
        </DialogHeader>

          {isLoading && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-5/6" />
              <div className="h-4 bg-neutral-200 rounded w-2/3" />
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-4/5" />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error instanceof Error ? error.message : "Failed to load preview"}
            </p>
          )}

          {content && (
            <div className="prose prose-neutral prose-sm max-w-none">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
};
