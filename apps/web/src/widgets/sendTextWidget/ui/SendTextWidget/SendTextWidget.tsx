import { type FC, useState, useCallback } from "react";

import { SendContent } from "~/features/sendContent";

import { KindleEmailSelector } from "~/widgets/kindleEmailSelector";

export const SendTextWidget: FC = () => {
  const [text, setText] = useState("");
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);

  const handleSuccess = () => setText("");
  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  return (
    <div className="mt-4 space-y-5">
      <textarea
        placeholder="Paste your text content here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        className="w-full border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <KindleEmailSelector value={kindleId} onChange={handleKindleChange} />
      <SendContent type="text" content={text} kindleEmailId={kindleId} onSuccess={handleSuccess} />
    </div>
  );
};
