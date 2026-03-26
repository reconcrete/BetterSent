import { useState, type FC } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";

type ApprovedSendersStepProps = {
  onNext: () => void;
  onBack: () => void;
};

const SENDER_EMAIL = "hello@bettersent.com";
const AMAZON_SETTINGS_URL =
  "https://www.amazon.com/hz/mycd/preferences/myx#/home/settings/payment";

export const ApprovedSendersStep: FC<ApprovedSendersStepProps> = ({ onNext, onBack }) => {
  const { capture } = useAnalytics();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SENDER_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClick = () => {
    capture("onboarding_step_completed", { step: 2 });
    onNext();
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Add Approved Sender</h2>
        <p className="text-sm text-muted-foreground">
          Amazon only delivers emails from approved senders. Add our email address to your
          approved senders list so your content gets delivered.
        </p>
      </div>

      <div className="flex items-center justify-between bg-accent border border-border rounded-lg px-4 py-3">
        <span className="text-sm font-medium text-foreground">{SENDER_EMAIL}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="size-4" />
              Copy
            </>
          )}
        </button>
      </div>

      <a
        href={AMAZON_SETTINGS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors"
      >
        <ExternalLink className="size-4" />
        Open Amazon Kindle Settings
      </a>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Where to add the email
        </p>
        <img
          src="/images/add-email-instruction.png"
          alt="Screenshot showing where to add approved sender email in Amazon settings"
          className="w-full rounded-lg border border-border"
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Where to find your Kindle email
        </p>
        <img
          src="/images/copy-kindle-address.png"
          alt="Screenshot showing where to find your Kindle email address"
          className="w-full rounded-lg border border-border"
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleClick}
          className="flex-1"
        >
          I've done this
        </Button>
      </div>
    </div>
  );
};
