import { useRef, useState, type FC } from "react";
import { Loader2, Monitor, ExternalLink } from "lucide-react";
import { Button, Input } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { useCreateDevice } from "~/entities/device";

type AddKindleEmailStepProps = {
  onComplete: () => void;
  onBack: () => void;
  isPending: boolean;
};

const AMAZON_SETTINGS_URL =
  "https://www.amazon.com/hz/mycd/preferences/myx#/home/settings/payment";

export const AddKindleEmailStep: FC<AddKindleEmailStepProps> = ({
  onComplete,
  onBack,
  isPending: markOnboardedPending,
}) => {
  const { capture } = useAnalytics();
  const emailCaptured = useRef(false);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const createDevice = useCreateDevice({
    onSuccess: () => onComplete(),
  });

  const isLoading = createDevice.isPending || markOnboardedPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (!email.trim().toLowerCase().endsWith("@kindle.com")) {
      setError(
        "Please enter a valid Kindle email address (must end with @kindle.com)"
      );
      return;
    }

    setError("");
    createDevice.mutate(
      { email: email.trim(), label: label.trim() || undefined },
      { onError: (err: Error) => setError(err.message) }
    );
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="flex flex-col gap-3 items-center">
        <div className="size-14 rounded-2xl bg-primary/15 dark:bg-primary/10 flex items-center justify-center">
          <Monitor className="size-6 text-secondary dark:text-primary" />
        </div>
        <div className="flex flex-col gap-1 items-center text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Enter your Kindle email
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-[400px]">
            This is where we'll deliver your content. It ends in
            @kindle.com
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-foreground">
            Kindle email address
          </label>
          <Input
            type="email"
            placeholder="yourname@kindle.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (!emailCaptured.current && e.target.value.length > 0) {
                emailCaptured.current = true;
                capture("onboarding_kindle_email_typed");
              }
            }}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-foreground">
            Label <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. My Kindle Paperwhite"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-foreground">
            Where to find your Kindle email
          </p>
          <div className="bg-primary/[0.06] dark:bg-primary/[0.04] border border-primary/15 dark:border-primary/10 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-[12px] leading-relaxed">
              <a
                href={AMAZON_SETTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-secondary dark:text-primary hover:opacity-80 transition-opacity"
              >
                <ExternalLink className="size-3 inline-block align-[-1px] mr-1" />
                Open Kindle Settings
              </a>{" "}
              <span className="text-muted-foreground">
                and find this section with your book
              </span>
            </p>
            <div className="rounded-[10px] overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
              <img
                src="/images/copy-kindle-address.png"
                alt="Screenshot showing where to find your Kindle email in Amazon settings"
                className="w-full block"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 h-12 rounded-xl text-[15px] font-medium"
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 rounded-xl text-sm font-semibold"
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin size-4" />
                Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
