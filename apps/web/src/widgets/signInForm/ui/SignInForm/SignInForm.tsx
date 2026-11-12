import type { FC } from "react";
import { Fragment } from "react";

import { GoogleSignIn } from "~/features/googleSignIn";
import { MagicLinkSignIn } from "~/features/magicLinkSignIn";
import { PasswordSignIn } from "~/features/passwordSignIn";
import { Separator } from "~/shared/ui";
import { signInOptions, type SignInOption } from "~/shared/lib";


type SignInFormProps = {
  /** Where to land after sign-in (relative path). Defaults to the app root. */
  callbackURL?: string;
};

const METHODS: Record<SignInOption, FC<SignInFormProps>> = {
  google: GoogleSignIn,
  login: PasswordSignIn,
  magiclink: MagicLinkSignIn,
};

const OrSeparator: FC = () => (
  <div className="flex items-center gap-4">
    <Separator className="flex-1" />
    <span className="text-xs text-muted-foreground">or</span>
    <Separator className="flex-1" />
  </div>
);

/** Shows the methods in SIGN_IN_OPTIONS, in the order listed there. */
export const SignInForm: FC<SignInFormProps> = ({ callbackURL }) => (
  <div className="bg-card border border-border rounded-[20px] p-[30px] space-y-5">
    {signInOptions.map((option, i) => {
      const Method = METHODS[option];
      return (
        <Fragment key={option}>
          {i > 0 && <OrSeparator />}
          <Method callbackURL={callbackURL} />
        </Fragment>
      );
    })}
  </div>
);
