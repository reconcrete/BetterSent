import type { FC } from "react";
import { Lock, Star, Loader2 } from "lucide-react";

import { Button } from "~/shared/ui";
import { useCreateCheckout } from "~/entities/billing";

type UpgradePromptProps = {
  title: string;
  description: string;
};

export const UpgradePrompt: FC<UpgradePromptProps> = ({ title, description }) => {
  const checkout = useCreateCheckout();

  return (
    <div className="flex flex-col items-center gap-5 px-24 py-8">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl border border-primary/15 bg-primary/[0.08] p-[15px] dark:border-primary/15 dark:bg-primary/[0.08]">
          <Lock className="size-6 text-primary" />
        </div>
        <div className="flex flex-col gap-2 items-center text-center">
          <p className="text-base font-semibold text-foreground">
            {title}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <Button
        onClick={() => checkout.mutate()}
        disabled={checkout.isPending}
        className="rounded-xl px-7 py-3 h-auto"
      >
        {checkout.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Star className="size-3.5" />
        )}
        Upgrade to Pro
      </Button>
    </div>
  );
};
