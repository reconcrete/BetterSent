import type { FC } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useSession } from "~/shared/lib";

import { SignInCard } from "~/widgets/signInCard";

import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";

import { NavBar } from "../NavBar/NavBar";

export const AppLayout: FC = () => {
  const { data: session, isPending } = useSession();

  useOnboardingGuard();

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <SignInCard />;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar email={session.user.email} />
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
};
