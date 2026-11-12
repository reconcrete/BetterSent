import type { FC } from "react";
import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Button, Input } from "~/shared/ui";
import { signIn, useAnalytics } from "~/shared/lib";

type PasswordSignInProps = {
  callbackURL?: string;
};

export const PasswordSignIn: FC<PasswordSignInProps> = ({ callbackURL }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const analytics = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const absoluteCallbackURL = callbackURL
      ? new URL(callbackURL, window.location.origin).toString()
      : window.location.origin;

    try {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: absoluteCallbackURL,
      });
      if (error) {
        setError(error.message ?? "Invalid email or password");
      } else {
        analytics.capture("sign_in_password");
        window.location.assign(absoluteCallbackURL);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="password-email" className="text-sm font-semibold text-foreground">
          Email
        </label>
        <Input
          id="password-email"
          type="email"
          autoComplete="username"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-[46px] rounded-xl px-4"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password-password" className="text-sm font-semibold text-foreground">
          Password
        </label>
        <Input
          id="password-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-[46px] rounded-xl px-4"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full h-[48px] rounded-xl">
        {isLoading ? (
          "Signing in..."
        ) : (
          <>
            <KeyRound className="size-4" />
            Sign in
          </>
        )}
      </Button>
    </form>
  );
};
