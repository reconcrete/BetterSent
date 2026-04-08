import { type FC, useState, useCallback, useRef } from "react";
import { Info, Link } from "lucide-react";

import { Input } from "~/shared/ui";

import { SendContent } from "~/features/sendContent";
import { ChooseDevice } from "~/features/chooseDevice";

export const UrlSender: FC = () => {
  const [url, setUrl] = useState("");
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);
  const submitRef = useRef<(() => void) | null>(null);

  const handleSuccess = () => setUrl("");
  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5 justify-center">
        <Info className="size-[15px] shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Copy the link to the article you like and paste it below
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          type="url"
          placeholder="example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitRef.current?.()}
          icon={<Link />}
        />

        <ChooseDevice value={kindleId} onChange={handleKindleChange} />
      </div>

      <SendContent type="url" content={url} kindleEmailId={kindleId} onSuccess={handleSuccess} submitRef={submitRef} />
    </div>
  );
};
