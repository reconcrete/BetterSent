import { useEffect, useState, type FC } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Terminal, CheckCircle2, XCircle } from "lucide-react";

import { useSession, useAnalytics } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";
import { Button, Input, Logo } from "~/shared/ui";
import { ThemeToggle } from "~/features/toggleTheme";
import { SignInForm } from "~/widgets/signInForm";

const readError = (value: unknown, fallback: string) =>
  typeof value === "object" && value && "error" in value
    ? String((value as { error: unknown }).error)
    : fallback;

export const Device: FC = () => {
  const [searchParams] = useSearchParams();
  const { data: session, isPending: isSessionPending } = useSession();
  const analytics = useAnalytics();

  // The code arrives in the URL from the CLI, but is editable so it can be typed in by hand.
  const [userCode, setUserCode] = useState(searchParams.get("user_code")?.toUpperCase() ?? "");
  const [submittedCode, setSubmittedCode] = useState(userCode);
  const [decision, setDecision] = useState<"approved" | "denied" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const codeFromUrl = searchParams.get("user_code");
    if (codeFromUrl) {
      setUserCode(codeFromUrl.toUpperCase());
      setSubmittedCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  const isSignedIn = !!session;

  const { data: pendingLogin, isFetching: isLookingUp } = useQuery({
    queryKey: ["cliDevice", submittedCode],
    enabled: isSignedIn && !!submittedCode && !decision,
    retry: false,
    queryFn: async () => {
      const response = await api.cli.device({ userCode: submittedCode }).get();
      if (response.error) {
        throw new Error(readError(response.error.value, "This code is not valid"));
      }
      return response.data?.data ?? null;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await api.cli.device({ userCode: submittedCode }).approve.post();
      if (response.error) {
        throw new Error(readError(response.error.value, "Failed to approve this login"));
      }
      return response.data?.data;
    },
    onSuccess: () => {
      analytics.capture("cli_login_approved");
      setDecision("approved");
    },
    onError: (err: Error) => setError(err.message),
  });

  const denyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.cli.device({ userCode: submittedCode }).deny.post();
      if (response.error) {
        throw new Error(readError(response.error.value, "Failed to reject this login"));
      }
      return response.data?.data;
    },
    onSuccess: () => setDecision("denied"),
    onError: (err: Error) => setError(err.message),
  });

  const isDeciding = approveMutation.isPending || denyMutation.isPending;
  const lookupError = !isLookingUp && submittedCode && !pendingLogin && !decision;

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[414px] space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Logo className="text-[28px]" />
          <p className="text-sm text-muted-foreground">Device login</p>
        </div>

        {isSessionPending ? (
          <div className="flex justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isSignedIn ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Sign in to confirm the login request from your terminal.
            </p>
            <SignInForm
              callbackURL={`/device${userCode ? `?user_code=${encodeURIComponent(userCode)}` : ""}`}
            />
          </div>
        ) : decision === "approved" ? (
          <div className="space-y-3 rounded-[20px] border border-border bg-card p-[30px] text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h1 className="text-lg font-bold text-foreground">You're all set</h1>
            <p className="text-sm text-muted-foreground">
              Head back to your terminal — the Bettersent CLI is now signed in as{" "}
              <span className="font-medium text-foreground">{session.user.email}</span>. You can
              close this tab.
            </p>
          </div>
        ) : decision === "denied" ? (
          <div className="space-y-3 rounded-[20px] border border-border bg-card p-[30px] text-center">
            <XCircle className="mx-auto size-10 text-destructive" />
            <h1 className="text-lg font-bold text-foreground">Login rejected</h1>
            <p className="text-sm text-muted-foreground">
              Nothing was granted access. You can close this tab.
            </p>
          </div>
        ) : (
          <div className="space-y-5 rounded-[20px] border border-border bg-card p-[30px]">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Terminal className="size-4 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-base font-bold text-foreground">
                  Confirm the code in your terminal
                </h1>
                <p className="text-sm text-muted-foreground">
                  {pendingLogin?.hostname ? (
                    <>
                      <span className="font-medium text-foreground">{pendingLogin.hostname}</span>{" "}
                      wants to sign in. Make sure the code below matches the one shown by{" "}
                      <code>bettersent login</code>.
                    </>
                  ) : (
                    <>
                      Make sure the code below matches the one shown by <code>bettersent login</code>
                      .
                    </>
                  )}
                </p>
              </div>
            </div>

            {pendingLogin ? (
              <p className="rounded-xl bg-muted py-4 text-center font-mono text-2xl font-bold tracking-[0.2em] text-foreground">
                {pendingLogin.userCode}
              </p>
            ) : (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError("");
                  setSubmittedCode(userCode.trim().toUpperCase());
                }}
              >
                <Input
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX"
                  autoFocus
                  className="h-[46px] rounded-xl px-4 text-center font-mono tracking-[0.2em]"
                />
                <Button type="submit" disabled={!userCode.trim() || isLookingUp} className="h-[46px] w-full rounded-xl">
                  {isLookingUp ? <Loader2 className="size-4 animate-spin" /> : "Continue"}
                </Button>
              </form>
            )}

            {lookupError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                That code is invalid or has expired. Run <code>bettersent login</code> again.
              </p>
            )}

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            {pendingLogin && (
              <div className="space-y-3">
                <p className="text-center text-xs text-muted-foreground">
                  Signing in as <span className="font-medium">{session.user.email}</span>
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    disabled={isDeciding}
                    onClick={() => denyMutation.mutate()}
                    className="h-[46px] flex-1 rounded-xl"
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={isDeciding}
                    onClick={() => approveMutation.mutate()}
                    className="h-[46px] flex-1 rounded-xl"
                  >
                    {isDeciding ? <Loader2 className="size-4 animate-spin" /> : "Log in"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
