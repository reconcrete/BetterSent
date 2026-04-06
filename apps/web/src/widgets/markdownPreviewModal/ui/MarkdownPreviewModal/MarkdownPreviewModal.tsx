import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, TriangleAlert } from "lucide-react";

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
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-xl bg-primary/[0.08] border border-primary/15">
              <FileText className="size-4 text-secondary dark:text-primary" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-semibold tracking-tight">
                Content Preview
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Extracted markdown
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-hidden px-6 py-5">
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-5 bg-muted rounded-md w-2/3" />
              <div className="space-y-2.5 pt-1">
                <div className="h-3.5 bg-muted/70 rounded w-full" />
                <div className="h-3.5 bg-muted/70 rounded w-[92%]" />
                <div className="h-3.5 bg-muted/70 rounded w-4/5" />
              </div>
              <div className="space-y-2.5 pt-2">
                <div className="h-3.5 bg-muted/70 rounded w-full" />
                <div className="h-3.5 bg-muted/70 rounded w-[88%]" />
                <div className="h-3.5 bg-muted/70 rounded w-3/4" />
                <div className="h-3.5 bg-muted/70 rounded w-[95%]" />
              </div>
              <div className="space-y-2.5 pt-2">
                <div className="h-3.5 bg-muted/70 rounded w-5/6" />
                <div className="h-3.5 bg-muted/70 rounded w-2/3" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-sm text-destructive bg-destructive/8 border border-destructive/15 px-4 py-3 rounded-xl">
              <TriangleAlert className="size-4 mt-0.5 shrink-0" />
              <p>{error instanceof Error ? error.message : "Failed to load preview"}</p>
            </div>
          )}

          {content && (
            <div className="prose prose-neutral dark:prose-invert prose-sm max-w-none prose-headings:tracking-tight prose-headings:font-semibold prose-p:leading-relaxed prose-a:text-secondary dark:prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/60 prose-pre:rounded-xl dark:prose-pre:bg-white/[0.06] dark:prose-pre:border-white/10 dark:prose-pre:text-foreground/90 prose-code:text-secondary dark:prose-code:text-primary prose-code:font-medium prose-img:rounded-xl prose-blockquote:border-primary/30 prose-blockquote:not-italic prose-hr:border-border/60">
              <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
