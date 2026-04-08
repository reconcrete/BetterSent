import { type FC, type RefObject, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";

import { Button } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";
import { BILLING_STATUS_KEY } from "~/entities/billing";
import type { HistoryItem } from "~/widgets/historyCard";

type SendContentProps = {
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string | File | null;
  kindleEmailId?: string;
  onSuccess?: () => void;
  submitRef?: RefObject<(() => void) | null>;
};

type MutationVars = {
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string | File | null;
  kindleEmailId?: string;
};

export const SendContent: FC<SendContentProps> = ({ type, content, kindleEmailId, onSuccess, submitRef }) => {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (vars: MutationVars) => {
      setError(null);

      if (vars.type === "url" && typeof vars.content === "string") {
        const normalized = vars.content.trim().toLowerCase();
        if (
          normalized.includes("youtube.com/") ||
          normalized.includes("youtu.be/")
        ) {
          throw new Error("YouTube links should be sent through the YouTube tab.");
        }
      }

      let response;
      if (vars.type === "file") {
        if (!(vars.content instanceof File)) {
          throw new Error("No file selected.");
        }
        response = await api.extract.file.post({ file: vars.content, kindleEmailId: vars.kindleEmailId });
      } else if (vars.type === "youtube") {
        response = await api.extract.youtube.post({ url: vars.content as string, kindleEmailId: vars.kindleEmailId });
      } else if (vars.type === "topic") {
        response = await api.extract.topic.post({ topic: vars.content as string, kindleEmailId: vars.kindleEmailId });
      } else if (vars.type === "url") {
        response = await api.extract.url.post({ url: vars.content as string, kindleEmailId: vars.kindleEmailId });
      } else {
        response = await api.extract.text.post({ textContent: vars.content as string, kindleEmailId: vars.kindleEmailId });
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
      await queryClient.cancelQueries({ queryKey: ["sendHistory"] });
      const previous = queryClient.getQueryData<HistoryItem[]>(["sendHistory"]);

      const tempId = crypto.randomUUID();
      const optimisticItem: HistoryItem = {
        id: tempId,
        type: vars.type,
        content: typeof vars.content === "string" ? vars.content : vars.content?.name ?? "",
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
      onSuccess?.();

      return { previous, tempId };
    },
    onSuccess: (data, vars, context) => {
      if (context?.tempId && data) {
        const historyId = data.data?.historyId;
        if (historyId) {
          queryClient.setQueryData<HistoryItem[]>(["sendHistory"], (old = []) =>
            old.map((item) => (item.id === context.tempId ? { ...item, id: historyId } : item))
          );
        }
      }
      analytics.capture("extraction_sent", { type: vars.type });
      queryClient.invalidateQueries({ queryKey: BILLING_STATUS_KEY });
    },
    onError: (err: Error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["sendHistory"], context.previous);
      }
      setError(err.message);
    },
  });

  const canSend =
    type === "file"
      ? content instanceof File
      : typeof content === "string" && content.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    mutate({ type, content, kindleEmailId });
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
        Send to Kindle
      </Button>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
    </div>
  );
};
