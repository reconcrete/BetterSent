import type { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 as Loader, Send } from "lucide-react";

import { Button } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";

type SendContentProps = {
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string | File | null;
  kindleEmailId?: string;
  onSuccess?: () => void;
};

export const SendContent: FC<SendContentProps> = ({ type, content, kindleEmailId, onSuccess }) => {
  const analytics = useAnalytics();
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (type === "file") {
        if (!(content instanceof File)) {
          throw new Error("No file selected.");
        }
        return api.extract.file.post({ file: content, kindleEmailId });
      }

      if (type === "youtube") {
        return api.extract.youtube.post({ url: content as string, kindleEmailId });
      }

      if (type === "topic") {
        return api.extract.topic.post({ topic: content as string, kindleEmailId });
      }

      if (type === "url") {
        return api.extract.url.post({ url: content as string, kindleEmailId });
      }
      return api.extract.text.post({ textContent: content as string, kindleEmailId });
    },
    onSuccess: () => {
      analytics.capture("extraction_sent", { type });
      onSuccess?.();
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

  return (
    <Button
      onClick={handleSend}
      disabled={isPending || !canSend}
      size="lg"
      className="w-full"
    >
      {isPending ? (
        <>
          <Loader className="animate-spin" />
          Sending to Kindle...
        </>
      ) : (
        <>
          <Send />
          Send to Kindle
        </>
      )}
    </Button>
  );
};
