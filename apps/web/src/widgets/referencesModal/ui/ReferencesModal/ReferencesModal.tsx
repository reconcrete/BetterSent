import { type FC, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Copy, Check, Send } from "lucide-react";

import { api } from "~/shared/lib/treaty";
import { useAnalytics } from "~/shared/lib";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "~/shared/ui";
import type { ReferencesModalProps } from "~/entities/modals/types";
import type { HistoryItem } from "~/entities/sendHistory";

const ReferenceRow: FC<{ url: string; title: string | null }> = ({ url, title }) => {
  const [copied, setCopied] = useState(false);
  const analytics = useAnalytics();
  const queryClient = useQueryClient();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const { mutate: send, isPending: isSending } = useMutation({
    mutationFn: async () => {
      const response = await api.extract.url.post({ url });
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? (errorValue as { error: string }).error
            : "Failed to send";
        throw new Error(errorMessage);
      }
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["sendHistory"] });
      const previous = queryClient.getQueryData<HistoryItem[]>(["sendHistory"]);

      const tempId = crypto.randomUUID();
      const optimisticItem: HistoryItem = {
        id: tempId,
        type: "url",
        content: url,
        title: null,
        author: null,
        status: "processing",
        errorMessage: null,
        kindleLabel: null,
        hasPreview: false,
        references: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<HistoryItem[]>(["sendHistory"], (old = []) => [optimisticItem, ...old]);
      return { previous, tempId };
    },
    onSuccess: (data, _, context) => {
      if (context?.tempId && data) {
        const historyId = data.data?.historyId;
        if (historyId) {
          queryClient.setQueryData<HistoryItem[]>(["sendHistory"], (old = []) =>
            old.map((item) => (item.id === context.tempId ? { ...item, id: historyId } : item))
          );
        }
      }
      analytics.capture("reference_sent", { url });
    },
    onError: (_err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["sendHistory"], context.previous);
      }
    },
  });

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0"
      >
        <p className="text-sm font-medium text-foreground group-hover:text-secondary dark:group-hover:text-primary truncate">
          {title || url}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {url}
        </p>
      </a>
      <div className="flex items-center gap-0.5 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleCopy}
              className="size-6 [&_svg]:size-3"
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => send()}
              disabled={isSending}
              className="size-6 [&_svg]:size-3"
            >
              <Send />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send to your default device</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export const ReferencesModal: FC<ReferencesModalProps> = ({
  references,
  closeModal,
}) => {
  return (
    <Dialog open onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-xl bg-primary/[0.08] border border-primary/15">
              <Link className="size-4 text-secondary dark:text-primary" />
            </div>
            <div className="space-y-0.5">
              <DialogTitle className="text-base font-semibold tracking-tight">
                References
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Links found in content
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-hidden px-6 py-5">
          {references.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No references found
            </p>
          )}

          {references.length > 0 && (
            <div className="space-y-1">
              {references.map((ref, i) => (
                <ReferenceRow key={i} url={ref.url} title={ref.title} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
