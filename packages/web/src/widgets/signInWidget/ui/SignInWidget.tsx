import type { FC } from "react";
import { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/shared/ui";
import { SignInEmailForm } from "~/features/signInEmail";
import { SignInMagicLinkForm } from "~/features/signInMagicLink";
import { SignUpEmailForm } from "~/features/signUpEmail";

type AuthTab = "signin" | "magic-link" | "signup";

export const SignInWidget: FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">Kindle Wrap</h1>
          <p className="text-neutral-500">
            {activeTab === "signup"
              ? "Create a new account"
              : "Sign in to your account"}
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-6 space-y-5">
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
