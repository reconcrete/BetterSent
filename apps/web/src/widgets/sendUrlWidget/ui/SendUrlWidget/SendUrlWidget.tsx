import { type FC, useState, useCallback } from "react";

import { Input } from "~/shared/ui";

import { SendContent } from "~/features/sendContent";

import { KindleEmailSelector } from "~/widgets/kindleEmailSelector";

export const SendUrlWidget: FC = () => {
  const [url, setUrl] = useState("");
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);

  const handleSuccess = () => setUrl("");
  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  return (
    <div className="mt-4 space-y-5">
      <Input
        type="url"
        placeholder="https://example.com/article"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <KindleEmailSelector value={kindleId} onChange={handleKindleChange} />
      <SendContent type="url" content={url} kindleEmailId={kindleId} onSuccess={handleSuccess} />
    </div>
  );
};
