import type { FC } from "react";

import { GoogleSignIn } from "~/features/googleSignIn";
import { MagicLinkSignIn } from "~/features/magicLinkSignIn";
import { Separator } from "~/shared/ui";
import { isProduction } from "~/shared/lib";


type SignInFormProps = {
  /** Where to land after signing in. Defaults to the app root. */
  callbackURL?: string;
};

export const SignInForm: FC<SignInFormProps> = ({ callbackURL }) => {
  return (
    <div className="bg-card border border-border rounded-[20px] p-[30px] space-y-5">
      <GoogleSignIn callbackURL={callbackURL} />

      {!isProduction && (
        <>
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <MagicLinkSignIn callbackURL={callbackURL} />
        </>
      )}
    </div>
  );
};
