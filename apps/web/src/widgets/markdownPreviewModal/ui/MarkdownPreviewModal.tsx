import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { api } from "~/shared/lib/treaty";
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
    <Dialog.Root open onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl border border-neutral-200 shadow-lg p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-xl font-bold text-black">
            Markdown Preview
          </Dialog.Title>
          <Dialog.Description className="text-sm text-neutral-500 mt-1 mb-4">
            Preview of the extracted content in markdown format.
          </Dialog.Description>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-neutral-400 hover:text-black transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>

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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
