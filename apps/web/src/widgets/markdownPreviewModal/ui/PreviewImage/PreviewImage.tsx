import { useState } from "react";
import type { Components } from "react-markdown";
import { ImageOff } from "lucide-react";

export const PreviewImage: Components["img"] = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <span className="my-4 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <ImageOff className="size-3.5 shrink-0" />
        {alt || "Image unavailable"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className="mx-auto block rounded-xl"
    />
  );
};
