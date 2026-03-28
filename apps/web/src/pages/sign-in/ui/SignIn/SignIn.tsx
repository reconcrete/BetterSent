import type { FC } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useSession } from "~/shared/lib";
import { SignInCard } from "~/widgets/signInCard";

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

  return <SignInCard />;
};
