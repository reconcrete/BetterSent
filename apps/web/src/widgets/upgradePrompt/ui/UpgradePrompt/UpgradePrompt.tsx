import type { FC } from "react";
import { Lock, Zap, Loader2 } from "lucide-react";

import { Button } from "~/shared/ui";
import { useCreateCheckout } from "~/entities/billing";

type UpgradePromptProps = {
  feature: string;
};

export const UpgradePrompt: FC<UpgradePromptProps> = ({ feature }) => {
  const checkout = useCreateCheckout();

  return (
    <div className="mt-4 flex flex-col items-center gap-4 py-8 text-center">
      <div className="rounded-full bg-muted p-3">
        <Lock className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {feature} requires Pro
        </p>
        <p className="text-sm text-muted-foreground">
          Upgrade to unlock {feature.toLowerCase()}, plus 500 extractions/month.
        </p>
      </div>
      <Button
        onClick={() => checkout.mutate()}
        disabled={checkout.isPending}
        size="lg"
      >
        {checkout.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Zap className="size-4" />
        )}
        Upgrade to Pro
      </Button>
    </div>
  );
};
