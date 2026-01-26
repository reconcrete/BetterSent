import type { FC } from "react";
import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button, Input } from "~/shared/ui";
import { signUp } from "~/shared/lib";

type SignUpEmailFormProps = {
  onSuccess?: () => void;
};

export const SignUpEmailForm: FC<SignUpEmailFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await signUp.email({ email, password, name });
      if (error) {
        setError(error.message ?? "Sign up failed");
      } else {
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
        <label htmlFor="signup-name" className="text-sm font-medium text-black">
          Name
        </label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-neutral-200 text-black placeholder:text-neutral-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-email" className="text-sm font-medium text-black">
          Email
        </label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-neutral-200 text-black placeholder:text-neutral-400"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup-password" className="text-sm font-medium text-black">
          Password
        </label>
        <Input
          id="signup-password"
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
            <UserPlus className="size-4" />
            Sign Up
          </>
        )}
      </Button>
    </form>
  );
};
