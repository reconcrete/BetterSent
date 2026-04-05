import { useState, type FC } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "~/shared/ui";

type ApprovedSendersStepProps = {
  onNext: () => void;
  onBack: () => void;
};

const SENDER_EMAIL = "deliver@bettersent.com";
const AMAZON_SETTINGS_URL =
  "https://www.amazon.com/hz/mycd/preferences/myx#/home/settings/payment";

export const ApprovedSendersStep: FC<ApprovedSendersStepProps> = ({
  onNext,
  onBack,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(SENDER_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="flex flex-col gap-3 items-center">
        <div className="size-14 rounded-2xl bg-primary/15 dark:bg-primary/10 flex items-center justify-center">
          <Check className="size-6 text-secondary dark:text-primary" />
        </div>
        <div className="flex flex-col gap-1 items-center text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Add approved sender
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-[420px]">
            Amazon only delivers emails from approved senders. Add our email so
            your content arrives on your Kindle.
          </p>
        </div>
      </div>

      {/* Step 1: Copy email */}
      <div className="flex gap-4 items-start w-full">
        <div className="size-7 rounded-full bg-primary/15 dark:bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[13px] font-bold text-secondary dark:text-primary">
            1
          </span>
        </div>
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground text-left">
            Copy our email address
          </p>
          <div className="flex items-center justify-between bg-black/[0.03] dark:bg-white/[0.04] border border-black/8 dark:border-white/8 rounded-xl px-4 py-4">
            <span className="text-sm font-mono text-foreground truncate">
              {SENDER_EMAIL}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[13px] font-medium text-secondary dark:text-primary hover:opacity-80 transition-opacity shrink-0 ml-3"
            >
              {copied ? (
                <>
                  <Check className="size-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Open settings */}
      <div className="flex gap-4 items-start w-full">
        <div className="size-7 rounded-full bg-primary/15 dark:bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[13px] font-bold text-secondary dark:text-primary">
            2
          </span>
        </div>
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground text-left">
            Open your Amazon Kindle settings
          </p>
          <a
            href={AMAZON_SETTINGS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-secondary dark:text-primary hover:opacity-80 transition-opacity w-fit"
          >
            <ExternalLink className="size-3" />
            Open Kindle Settings
          </a>
        </div>
      </div>

      {/* Step 3: Add to approved list */}
      <div className="flex gap-4 items-start w-full">
        <div className="size-7 rounded-full bg-primary/15 dark:bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[13px] font-bold text-secondary dark:text-primary">
            3
          </span>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground text-left">
            Add to approved personal document e-mail list
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground text-left">
            Find "Approved Personal Document E-mail List" and click "Add a new
            approved e-mail address"
          </p>
        </div>
      </div>

      {/* Helper image */}
      <div className="w-full rounded-xl border border-black/5 dark:border-white/5 overflow-hidden">
        <img
          src="/images/add-email-instruction.png"
          alt="Screenshot showing where to add approved sender email in Amazon Kindle settings"
          className="w-full block"
        />
      </div>

      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-12 rounded-xl text-[15px] font-medium"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 h-12 rounded-xl text-sm font-semibold"
        >
          I've done this
        </Button>
      </div>
    </div>
  );
};
