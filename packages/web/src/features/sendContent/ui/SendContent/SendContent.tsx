import type { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 as Loader, Send } from "lucide-react";

import { Button } from "~/shared/ui";
import { api } from "~/shared/lib/treaty";

type SendContentProps = {
  type: "url" | "text" | "file";
  content: string | File | null;
  kindleEmailId?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export const SendContent: FC<SendContentProps> = ({
  type,
  content,
  kindleEmailId,
  onSuccess,
  onError,
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (type === "url") {
        return api.extract.url.post({ url: content as string, kindleEmailId });
      }
      if (type === "text") {
        return api.extract.text.post({ textContent: content as string, kindleEmailId });
      }
      return api.extract.file.post({ file: content as File, kindleEmailId });
    },
    onSuccess: (res) => {
      if (!res.error) onSuccess?.();
      else {
        const msg =
          res.error?.value && typeof res.error.value === "object" && "error" in res.error.value
            ? (res.error.value as { error: string }).error
            : typeof res.error?.value === "string"
              ? res.error.value
              : "Something went wrong";
        onError?.(msg);
      }
    },
  });

  const hasContent =
    type === "file" ? content instanceof File : typeof content === "string" && content.trim().length > 0;

  const handleSend = () => {
    if (!hasContent) return;
    mutate();
  };

  return (
    <Button
      onClick={handleSend}
      disabled={isPending || !hasContent}
      size="lg"
      className="w-full bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300"
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
