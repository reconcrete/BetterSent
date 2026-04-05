import { type FC, type MutableRefObject, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 as Loader, Send } from "lucide-react";

import { Button } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";
import { BILLING_STATUS_KEY } from "~/entities/billing";

type SendContentProps = {
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string | File | null;
  kindleEmailId?: string;
  onSuccess?: () => void;
  submitRef?: MutableRefObject<(() => void) | null>;
};

export const SendContent: FC<SendContentProps> = ({ type, content, kindleEmailId, onSuccess, submitRef }) => {
  const analytics = useAnalytics();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      setError(null);

      let response;
      if (type === "file") {
        if (!(content instanceof File)) {
          throw new Error("No file selected.");
        }
        response = await api.extract.file.post({ file: content, kindleEmailId });
      } else if (type === "youtube") {
        response = await api.extract.youtube.post({ url: content as string, kindleEmailId });
      } else if (type === "topic") {
        response = await api.extract.topic.post({ topic: content as string, kindleEmailId });
      } else if (type === "url") {
        response = await api.extract.url.post({ url: content as string, kindleEmailId });
      } else {
        response = await api.extract.text.post({ textContent: content as string, kindleEmailId });
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
    onSuccess: () => {
      analytics.capture("extraction_sent", { type });
      queryClient.invalidateQueries({ queryKey: BILLING_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: ["sendHistory"] });
      onSuccess?.();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const canSend =
    type === "file"
      ? content instanceof File
      : typeof content === "string" && content.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    mutate();
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
        {isPending ? (
          <>
            <Loader className="size-3.5 animate-spin" />
            Sending to Kindle...
          </>
        ) : (
          <>
            <Send className="size-3.5" />
            Send to Kindle
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}
    </div>
  );
};
