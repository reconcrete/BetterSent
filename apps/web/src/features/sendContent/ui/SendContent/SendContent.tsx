import { type FC, type RefObject, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { Button } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";
import { BILLING_STATUS_KEY } from "~/entities/billing";
import { reconcileOptimisticSend, type HistoryItem } from "~/entities/sendHistory";

type SendContentProps = {
  type: "url" | "text" | "file" | "youtube";
  content: string | File | File[] | null;
  kindleEmailId?: string;
  title?: string;
  author?: string;
  getFileDetails?: (file: File) => { title?: string; author?: string };
  onSuccess?: () => void;
  submitRef?: RefObject<(() => void) | null>;
};

type MutationVars = {
  type: "url" | "text" | "file" | "youtube";
  content: string | File | null;
  kindleEmailId?: string;
  title?: string;
  author?: string;
};

export const SendContent: FC<SendContentProps> = ({ type, content, kindleEmailId, title, author, getFileDetails, onSuccess, submitRef }) => {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const { mutate } = useMutation({
    mutationFn: async (vars: MutationVars) => {
      if (vars.type === "url" && typeof vars.content === "string") {
        const normalized = vars.content.trim().toLowerCase();
        if (
          normalized.includes("youtube.com/") ||
          normalized.includes("youtu.be/")
        ) {
          throw new Error("YouTube links should be sent through the YouTube tab.");
        }
      }

      const bookDetails = {
        title: vars.title?.trim() || undefined,
        author: vars.author?.trim() || undefined,
      };

      let response;
      if (vars.type === "file") {
        if (!(vars.content instanceof File)) {
          throw new Error("No file selected.");
        }
        response = await api.extract.file.post({ file: vars.content, kindleEmailId: vars.kindleEmailId, ...bookDetails });
      } else if (vars.type === "youtube") {
        response = await api.extract.youtube.post({ url: vars.content as string, kindleEmailId: vars.kindleEmailId, ...bookDetails });
      } else if (vars.type === "url") {
        response = await api.extract.url.post({ url: vars.content as string, kindleEmailId: vars.kindleEmailId, ...bookDetails });
      } else {
        response = await api.extract.text.post({ textContent: vars.content as string, kindleEmailId: vars.kindleEmailId, ...bookDetails });
      }

      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? (errorValue as { error: string }).error
            : "Failed to send content";
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onMutate: async (vars: MutationVars) => {
      setPendingCount((count) => count + 1);
      await queryClient.cancelQueries({ queryKey: ["sendHistory"] });

      const tempId = crypto.randomUUID();
      const optimisticItem: HistoryItem = {
        id: tempId,
        type: vars.type,
        content: typeof vars.content === "string" ? vars.content : vars.content?.name ?? "",
        title: vars.title?.trim() || null,
        author: vars.author?.trim() || null,
        status: "processing",
        errorMessage: null,
        kindleLabel: null,
        hasPreview: false,
        references: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<HistoryItem[]>(["sendHistory"], (old = []) => [optimisticItem, ...old]);
      onSuccess?.();

      return { tempId };
    },
    onSuccess: (data, vars, context) => {
      if (context?.tempId && data) {
        const historyId = data.data?.historyId;
        if (historyId) {
          // The websocket may have already pushed the real row before this
          // response arrived — in that case the optimistic item is dropped
          // instead of remapped, so the send doesn't show up twice.
          queryClient.setQueryData<HistoryItem[]>(["sendHistory"], (old = []) =>
            reconcileOptimisticSend(old, context.tempId, historyId)
          );
        }
      }
      analytics.capture("extraction_sent", { type: vars.type });
      queryClient.invalidateQueries({ queryKey: BILLING_STATUS_KEY });
    },
    onError: (err: Error, vars, context) => {
      if (context?.tempId) {
        queryClient.setQueryData<HistoryItem[]>(["sendHistory"], (old = []) =>
          old.filter((item) => item.id !== context.tempId)
        );
      }
      setErrors((prev) => [
        ...prev,
        vars.content instanceof File ? `${vars.content.name}: ${err.message}` : err.message,
      ]);
    },
    onSettled: () => {
      setPendingCount((count) => count - 1);
    },
  });

  const isPending = pendingCount > 0;

  const canSend =
    type === "file"
      ? Array.isArray(content)
        ? content.length > 0
        : content instanceof File
      : typeof content === "string" && content.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    setErrors([]);
    const items = Array.isArray(content) ? content : [content];
    for (const item of items) {
      // Files carry their own per-file details; other senders use the shared title/author
      const details =
        item instanceof File
          ? (getFileDetails?.(item) ?? {})
          : { title, author };
      mutate({ type, content: item, kindleEmailId, ...details });
    }
  };

  useEffect(() => {
    if (submitRef) submitRef.current = handleSend;
  });

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSend}
        disabled={isPending || !canSend}
        className="w-full rounded-xl py-3 h-auto font-semibold"
      >
        <Send className="size-3.5" />
        {Array.isArray(content) && content.length > 1
          ? `Send ${content.length} files to Kindle`
          : "Send to Kindle"}
      </Button>
      {errors.length > 0 && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl space-y-1">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
    </div>
  );
};
