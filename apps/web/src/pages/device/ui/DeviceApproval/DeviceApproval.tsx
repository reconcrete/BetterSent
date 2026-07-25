import { useState, type FC, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, TerminalSquare, XCircle } from "lucide-react";

import { authClient, useSession, useAnalytics } from "~/shared/lib";
import { Button, Input, Logo } from "~/shared/ui";
import { ThemeToggle } from "~/features/toggleTheme";
import { SignInForm } from "~/widgets/signInForm";

type Outcome = "approved" | "denied";

export const DeviceApproval: FC = () => {
  const { data: session, isPending } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const userCode = searchParams.get("user_code") ?? "";

  const analytics = useAnalytics();
  const [codeInput, setCodeInput] = useState("");
  const [submitting, setSubmitting] = useState<Outcome | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = async (decision: Outcome) => {
    setSubmitting(decision);
    setError(null);

    const { error: apiError } =
      decision === "approved"
        ? await authClient.device.approve({ userCode })
        : await authClient.device.deny({ userCode });

    setSubmitting(null);

    if (apiError) {
      setError(apiError.error_description || "Something went wrong. Try again.");
      return;
    }

    analytics.capture(decision === "approved" ? "cli_device_approved" : "cli_device_denied");
    setOutcome(decision);
  };

  const handleCodeSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = codeInput.trim().toUpperCase();
    if (!normalized) return;
    setSearchParams({ user_code: normalized });
  };

  let content;

  if (isPending) {
    content = <Loader2 className="size-6 animate-spin text-muted-foreground" />;
  } else if (!session) {
    content = (
      <div className="w-full max-w-[414px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Sign in to continue</h1>
          <p className="text-sm text-muted-foreground">
            A device is requesting access to your Bettersent account.
          </p>
        </div>
        <SignInForm callbackURL={userCode ? `/device?user_code=${encodeURIComponent(userCode)}` : "/device"} />
      </div>
    );
  } else if (outcome === "approved") {
    content = (
      <div className="w-full max-w-[414px] space-y-4 text-center">
        <CheckCircle2 className="size-12 mx-auto text-green-600 dark:text-green-500" />
        <h1 className="text-2xl font-bold text-foreground">Device connected</h1>
        <p className="text-sm text-muted-foreground">
          You can close this tab and return to your terminal.
        </p>
      </div>
    );
  } else if (outcome === "denied") {
    content = (
      <div className="w-full max-w-[414px] space-y-4 text-center">
        <XCircle className="size-12 mx-auto text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Request denied</h1>
        <p className="text-sm text-muted-foreground">
          The device was not given access to your account.
        </p>
      </div>
    );
  } else if (!userCode) {
    content = (
      <form onSubmit={handleCodeSubmit} className="w-full max-w-[414px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Connect a device</h1>
          <p className="text-sm text-muted-foreground">
            Enter the code shown in your terminal.
          </p>
        </div>
        <div className="bg-card border border-border rounded-[20px] p-[30px] space-y-4">
          <Input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="XXXX-XXXX"
            autoFocus
            className="text-center font-mono tracking-widest uppercase"
          />
          <Button type="submit" className="w-full" disabled={!codeInput.trim()}>
            Continue
          </Button>
        </div>
      </form>
    );
  } else {
    content = (
      <div className="w-full max-w-[414px] space-y-6">
        <div className="space-y-2 text-center">
          <TerminalSquare className="size-10 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Device sign-in request</h1>
          <p className="text-sm text-muted-foreground">
            The Bettersent CLI is asking for access to your account as{" "}
            <span className="font-medium text-foreground">{session.user.email}</span>.
          </p>
        </div>

        <div className="bg-card border border-border rounded-[20px] p-[30px] space-y-5">
          <div className="space-y-2 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Confirmation code</p>
            <p className="text-3xl font-mono font-bold tracking-[0.2em] text-foreground">{userCode}</p>
            <p className="text-xs text-muted-foreground">
              Only approve if this matches the code shown in your terminal.
            </p>
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={submitting !== null}
              onClick={() => handleDecision("denied")}
            >
              {submitting === "denied" && <Loader2 className="size-4 animate-spin" />}
              Deny
            </Button>
            <Button
              className="flex-1"
              disabled={submitting !== null}
              onClick={() => handleDecision("approved")}
            >
              {submitting === "approved" && <Loader2 className="size-4 animate-spin" />}
              Approve
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-background flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <Logo className="text-2xl" />
      </div>
      {content}
    </div>
  );
};
