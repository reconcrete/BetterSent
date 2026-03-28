import { type FC, useState, useCallback } from "react";

import { SendContent } from "~/features/sendContent";
import { useSubscriptionStatus } from "~/entities/billing";

import { KindleEmailSelector } from "~/widgets/kindleEmailSelector";
import { UpgradePrompt } from "~/widgets/upgradePrompt";

export const SendTopicWidget: FC = () => {
  const { data: status } = useSubscriptionStatus();

  if (status?.plan === "free") {
    return <UpgradePrompt feature="Topic generation" />;
  }
  const [topic, setTopic] = useState("");
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);

  const handleSuccess = () => setTopic("");
  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  return (
    <div className="mt-4 space-y-5">
      <textarea
        placeholder="Enter a topic or question, e.g. 'How stablecoins work and why USDT is priced at exactly 1 USD'"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        rows={4}
        className="w-full border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <KindleEmailSelector value={kindleId} onChange={handleKindleChange} />
      <SendContent type="topic" content={topic} kindleEmailId={kindleId} onSuccess={handleSuccess} />
    </div>
  );
};
