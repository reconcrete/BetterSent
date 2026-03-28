import type { FC } from "react";

import { GoogleSignIn } from "~/features/googleSignIn";
import { MagicLinkSignIn } from "~/features/magicLinkSignIn";
import { Separator } from "~/shared/ui";

export const SignInForm: FC = () => {
  return (
    <div className="bg-card border border-border rounded-[20px] p-[30px] space-y-5">
      <GoogleSignIn />

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <MagicLinkSignIn />
    </div>
  );
};
