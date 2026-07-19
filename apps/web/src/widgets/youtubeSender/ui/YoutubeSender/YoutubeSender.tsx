import { type FC, useState, useCallback, useRef } from "react";
import { Info, Link } from "lucide-react";

import { Input } from "~/shared/ui";

import { SendContent, BookDetailsFields } from "~/features/sendContent";
import { ChooseDevice } from "~/features/chooseDevice";
import { useSubscriptionStatus } from "~/entities/billing";

import { UpgradePrompt } from "~/widgets/upgradePrompt";

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)/;

export const YoutubeSender: FC = () => {
  const { data: status } = useSubscriptionStatus();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);
  const submitRef = useRef<(() => void) | null>(null);

  const handleUrlChange = (value: string) => {
    setYoutubeUrl(value);
    if (value.trim() && !YOUTUBE_URL_REGEX.test(value)) {
      setYoutubeError("Please enter a valid YouTube URL");
    } else {
      setYoutubeError(null);
    }
  };

  const handleSuccess = () => {
    setYoutubeUrl("");
    setYoutubeError(null);
    setBookTitle("");
    setBookAuthor("");
  };

  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  if (status?.plan === "free") {
    return (
      <UpgradePrompt
        title="Unlock YouTube to Kindle"
        description="Convert YouTube video transcripts into readable documents and send them straight to your Kindle."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5 justify-center">
        <Info className="size-[15px] shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Paste a YouTube video link to convert its transcript to a Kindle document
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Input
          type="url"
          placeholder="youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitRef.current?.()}
          icon={<Link />}
        />
        {youtubeError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
            {youtubeError}
          </p>
        )}

        <BookDetailsFields
          visible={!youtubeError && youtubeUrl.trim().length > 0}
          title={bookTitle}
          author={bookAuthor}
          onTitleChange={setBookTitle}
          onAuthorChange={setBookAuthor}
        />

        <ChooseDevice value={kindleId} onChange={handleKindleChange} />
      </div>

      <SendContent type="youtube" content={youtubeError ? "" : youtubeUrl} kindleEmailId={kindleId} title={bookTitle} author={bookAuthor} onSuccess={handleSuccess} submitRef={submitRef} />
    </div>
  );
};
