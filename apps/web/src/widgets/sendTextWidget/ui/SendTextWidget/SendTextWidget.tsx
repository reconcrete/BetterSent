import { type FC, useState, useCallback } from "react";
import { Info } from "lucide-react";

import { Textarea } from "~/shared/ui";

import { SendContent } from "~/features/sendContent";
import { ChooseDevice } from "~/features/chooseDevice";

export const SendTextWidget: FC = () => {
  const [text, setText] = useState("");
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);

  const handleSuccess = () => setText("");
  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5 justify-center">
        <Info className="size-[15px] shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Just type or paste your text into the field below
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Textarea
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <ChooseDevice value={kindleId} onChange={handleKindleChange} />
      </div>

      <SendContent type="text" content={text} kindleEmailId={kindleId} onSuccess={handleSuccess} />
    </div>
  );
};
