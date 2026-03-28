import type { FC } from "react";
import { useState } from "react";
import { Mail } from "lucide-react";

import { Button, Input } from "~/shared/ui";
import { signIn, useAnalytics } from "~/shared/lib";

type MagicLinkSignInProps = {
  callbackURL?: string;
};

export const MagicLinkSignIn: FC<MagicLinkSignInProps> = ({
  callbackURL,
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const analytics = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const absoluteCallbackURL = callbackURL
      ? new URL(callbackURL, window.location.origin).toString()
      : window.location.origin;

    try {
      const { error } = await signIn.magicLink({
        email,
        callbackURL: absoluteCallbackURL,
      });
      if (error) {
        setError(error.message ?? "Failed to send magic link");
      } else {
        analytics.capture("sign_in_magic_link");
        setIsSent(true);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center space-y-2 py-2">
        <p className="text-sm text-foreground">
          Magic link sent to <span className="font-medium">{email}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSent(false);
            setEmail("");
          }}
          className="text-xs text-primary hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="magic-link-email" className="text-sm font-semibold text-foreground">
          Email
        </label>
        <Input
          id="magic-link-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-[46px] rounded-xl px-4"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full h-[48px] rounded-xl">
        {isLoading ? (
          "Sending..."
        ) : (
          <>
            <Mail className="size-4" />
            Send Magic Link
          </>
        )}
      </Button>
    </form>
  );
};
