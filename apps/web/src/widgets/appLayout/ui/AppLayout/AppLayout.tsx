import type { FC } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useSession } from "~/shared/lib";

import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";

import { NavBar } from "../NavBar/NavBar";

export const AppLayout: FC = () => {
  const { data: session, isPending } = useSession();

  useOnboardingGuard();

  if (isPending) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  if (!session) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <NavBar email={session.user.email} />
      <main className="flex-1 px-4 pb-8">
        <Outlet />
      </main>
    </div>
  );
};
