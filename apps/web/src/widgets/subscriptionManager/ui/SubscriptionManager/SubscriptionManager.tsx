import type { FC } from "react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ExternalLink, Zap, Check } from "lucide-react";

import { Button } from "~/shared/ui";
import { useSubscriptionStatus, useCreateCheckout, useCreatePortal, BILLING_STATUS_KEY } from "~/entities/billing";

const UsageBar: FC<{ used: number; limit: number; label: string }> = ({ used, limit, label }) => {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isNearLimit ? "font-medium text-amber-500" : "text-muted-foreground"}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? "bg-amber-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const SubscriptionManager: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: status, isLoading, isPro } = useSubscriptionStatus();
  const checkout = useCreateCheckout();
  const portal = useCreatePortal();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      queryClient.invalidateQueries({ queryKey: BILLING_STATUS_KEY });
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("checkout") === "cancel") {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Current Plan
        </p>
        <div className="rounded-xl border bg-white px-5 py-4 dark:bg-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {isPro ? "Pro" : "Free"}
            </p>
            {isPro ? (
              <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-secondary dark:text-primary">
                Active
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Free tier
              </span>
            )}
          </div>

          {isPro && status?.cancelAtPeriodEnd && (
            <p className="text-sm text-amber-500">
              Ends on{" "}
              {new Date(status.currentPeriodEnd!).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          {isPro && status?.status === "past_due" && (
            <p className="text-sm text-destructive">
              Payment failed. Update your payment method to keep Pro features.
            </p>
          )}
        </div>
      </div>

      {/* Usage */}
      {status && (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Usage
          </p>
          <div className="rounded-xl border bg-white px-5 py-4 dark:bg-white/5 space-y-3">
            <UsageBar
              used={status.usage.extractionCount}
              limit={status.usage.extractionLimit}
              label="Extractions"
            />
            {isPro && (
              <UsageBar
                used={status.usage.topicCount}
                limit={status.usage.topicLimit}
                label="Topic generations"
              />
            )}
          </div>
        </div>
      )}

      {/* Manage / Upgrade */}
      {isPro ? (
        <Button
          variant="outline"
          onClick={() => portal.mutate()}
          disabled={portal.isPending}
        >
          {portal.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ExternalLink className="size-4" />
          )}
          Manage Subscription
        </Button>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Upgrade
          </p>
          <div className="rounded-xl border border-primary/15 bg-primary/[0.04] px-5 py-4 dark:bg-primary/[0.03] space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-secondary dark:text-primary" />
              <p className="text-sm font-medium text-foreground">Pro includes</p>
            </div>
            <ul className="space-y-2 ml-6">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-3.5 text-secondary dark:text-primary shrink-0" />
                500 extractions per month
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-3.5 text-secondary dark:text-primary shrink-0" />
                YouTube video extraction
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-3.5 text-secondary dark:text-primary shrink-0" />
                AI topic generation (50/month)
              </li>
            </ul>
            <Button
              onClick={() => checkout.mutate()}
              disabled={checkout.isPending}
              className="w-full"
            >
              {checkout.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              Upgrade to Pro
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
