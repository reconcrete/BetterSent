import type { FC } from "react";
import { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/shared/ui";
import { SignInEmailForm } from "~/features/signInEmail";
import { SignInMagicLinkForm } from "~/features/signInMagicLink";
import { SignUpEmailForm } from "~/features/signUpEmail";
import { signIn } from "~/shared/lib/auth";

type AuthTab = "signin" | "magic-link" | "signup";

export const SignInWidget: FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">Bettersent</h1>
          <p className="text-neutral-500">
            {activeTab === "signup"
              ? "Create a new account"
              : "Sign in to your account"}
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-6 space-y-5">
          <button
            type="button"
            onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4l3.56-2.77.01-.54z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-400">or</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthTab)}>
            <TabsList className="w-full grid grid-cols-3 bg-neutral-100">
              <TabsTrigger value="signin" className="text-xs data-[state=active]:bg-white">
                Password
              </TabsTrigger>
              <TabsTrigger value="magic-link" className="text-xs data-[state=active]:bg-white">
                Magic Link
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-xs data-[state=active]:bg-white">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <SignInEmailForm />
            </TabsContent>

            <TabsContent value="magic-link" className="mt-4">
              <SignInMagicLinkForm />
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <SignUpEmailForm />
            </TabsContent>
          </Tabs>
        </div>

        <div className="text-center">
          {activeTab !== "signup" ? (
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className="text-sm text-neutral-500 hover:text-black transition-colors"
            >
              Don't have an account? Sign up
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className="text-sm text-neutral-500 hover:text-black transition-colors"
            >
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
