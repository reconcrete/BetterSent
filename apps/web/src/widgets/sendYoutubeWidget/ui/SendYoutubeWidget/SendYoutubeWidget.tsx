import { type FC, useState, useCallback } from "react";

import { Input } from "~/shared/ui";

import { SendContent } from "~/features/sendContent";
import { useSubscriptionStatus } from "~/entities/billing";

import { KindleEmailSelector } from "~/widgets/kindleEmailSelector";
import { UpgradePrompt } from "~/widgets/upgradePrompt";

const YOUTUBE_URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)/;

export const SendYoutubeWidget: FC = () => {
  const { data: status } = useSubscriptionStatus();

  if (status?.plan === "free") {
    return <UpgradePrompt feature="YouTube extraction" />;
  }
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);

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
  };

  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  return (
    <div className="mt-4 space-y-5">
      <div className="space-y-3">
        <Input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        {youtubeError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {youtubeError}
          </p>
        )}
      </div>
      <KindleEmailSelector value={kindleId} onChange={handleKindleChange} />
      <SendContent type="youtube" content={youtubeUrl} kindleEmailId={kindleId} onSuccess={handleSuccess} />
    </div>
  );
};
