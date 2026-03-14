import type { FC } from "react";
import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";

import { Button, Input } from "~/shared/ui";
import { signIn, useAnalytics } from "~/shared/lib";

type SignInMagicLinkFormProps = {
  callbackURL?: string;
};

export const SignInMagicLinkForm: FC<SignInMagicLinkFormProps> = ({
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

    // Use absolute URL for callback (frontend origin)
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
      <div className="text-center py-4 space-y-3">
        <CheckCircle className="size-12 text-green-500 mx-auto" />
        <h3 className="text-lg font-medium text-black">Check your email</h3>
        <p className="text-sm text-neutral-500">
          We sent a magic link to <span className="font-medium text-black">{email}</span>
        </p>
        <p className="text-xs text-neutral-400">
          Click the link in the email to sign in. The link expires in 5 minutes.
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            setIsSent(false);
            setEmail("");
          }}
          className="mt-4"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="magic-link-email" className="text-sm font-medium text-black">
          Email
        </label>
        <Input
          id="magic-link-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-neutral-200 text-black placeholder:text-neutral-400"
        />
      </div>

      <p className="text-xs text-neutral-500">
        We'll send you a magic link to sign in without a password.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
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
