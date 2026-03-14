import type { FC } from "react";
import { useState } from "react";
import { LogIn } from "lucide-react";

import { Button, Input } from "~/shared/ui";
import { signIn, useAnalytics } from "~/shared/lib";

type SignInEmailFormProps = {
  onSuccess?: () => void;
};

export const SignInEmailForm: FC<SignInEmailFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const analytics = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await signIn.email({ email, password });
      if (error) {
        setError(error.message ?? "Login failed");
      } else {
        analytics.capture("sign_in_email");
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="signin-email" className="text-sm font-medium text-black">
          Email
        </label>
        <Input
          id="signin-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-neutral-200 text-black placeholder:text-neutral-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signin-password" className="text-sm font-medium text-black">
          Password
        </label>
        <Input
          id="signin-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="border-neutral-200 text-black placeholder:text-neutral-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          "Loading..."
        ) : (
          <>
            <LogIn className="size-4" />
            Sign In
          </>
        )}
      </Button>
    </form>
  );
};
