import type { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 as Loader, Send } from "lucide-react";

import { Button } from "~/shared/ui";
import { api } from "~/shared/lib/treaty";

type SendContentProps = {
  type: "url" | "text";
  content: string;
  kindleEmailId?: string;
  onSuccess?: () => void;
};

export const SendContent: FC<SendContentProps> = ({ type, content, kindleEmailId, onSuccess }) => {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (type === "url") {
        return api.extract.url.post({ url: content, kindleEmailId });
      }
      return api.extract.text.post({ textContent: content, kindleEmailId });
    },
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const handleSend = () => {
    if (!content.trim()) return;
    mutate();
  };

  return (
    <Button
      onClick={handleSend}
      disabled={isPending || !content.trim()}
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
