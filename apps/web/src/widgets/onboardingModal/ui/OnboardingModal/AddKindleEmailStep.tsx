import { useState, type FC } from "react";
import { Loader2 as Loader } from "lucide-react";
import { Button, Input } from "~/shared/ui";
import { useAnalytics } from "~/shared/lib";
import { useCreateDevice } from "~/entities/device";

type AddKindleEmailStepProps = {
  onComplete: () => void;
  onBack: () => void;
};

export const AddKindleEmailStep: FC<AddKindleEmailStepProps> = ({ onComplete, onBack }) => {
  const { capture } = useAnalytics();
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const createDevice = useCreateDevice({
    onSuccess: () => {
      capture("onboarding_step_completed", { step: 3 });
      onComplete();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (!email.trim().toLowerCase().endsWith("@kindle.com")) {
      setError("Please enter a valid Kindle email address (must end with @kindle.com)");
      return;
    }

    setError("");
    createDevice.mutate(
      { email: email.trim(), label: label.trim() || undefined },
      { onError: (err: Error) => setError(err.message) },
    );
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Add Your Kindle Email</h2>
        <p className="text-sm text-muted-foreground">
          Enter your Kindle email address so we know where to send your content.
          You can find it in your Amazon Kindle settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="onboard-kindle-email" className="text-sm font-medium text-foreground">
            Kindle Email
          </label>
          <Input
            id="onboard-kindle-email"
            type="email"
            placeholder="your-kindle@kindle.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={createDevice.isPending}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="onboard-kindle-label" className="text-sm font-medium text-foreground">
            Label (optional)
          </label>
          <Input
            id="onboard-kindle-label"
            type="text"
            placeholder="e.g., My Kindle Paperwhite"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={createDevice.isPending}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
            disabled={createDevice.isPending}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={createDevice.isPending || !email.trim()}
          >
            {createDevice.isPending ? (
              <>
                <Loader className="animate-spin size-4" />
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
