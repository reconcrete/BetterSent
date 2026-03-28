import type { FC } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useSession } from "~/shared/lib";
import { Logo } from "~/shared/ui";
import { ThemeToggle } from "~/features/toggleTheme";
import { SignInForm } from "~/widgets/signInForm";
import { EReaderGraphic } from "../EReaderGraphic/EReaderGraphic";

export const SignIn: FC = () => {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Left panel - Sign in form (55%) */}
      <div className="flex-1 lg:basis-[55%] flex flex-col items-center justify-center bg-background p-6 md:p-8">
        <div className="w-full max-w-[414px] space-y-8">
          <div className="space-y-2">
            <h1 className="flex items-end justify-center gap-2.5 text-[32px] font-bold text-foreground leading-[1.2]">
              Welcome to
              <Logo className="text-[32px]" />
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              First time here?{" "}
              <span className="text-secondary dark:text-primary cursor-pointer">Create account</span>
            </p>
          </div>

          <SignInForm />
        </div>
      </div>

      {/* Right panel - Illustration (45%, hidden on mobile) */}
      <div className="hidden lg:flex lg:basis-[45%] items-center justify-center bg-[#fbf3e2] dark:bg-[#1e2020] overflow-hidden relative">
        <EReaderGraphic />
      </div>
    </div>
  );
};
