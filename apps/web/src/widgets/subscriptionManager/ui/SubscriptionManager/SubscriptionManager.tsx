import type { FC } from "react";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2, ExternalLink, Zap, Crown } from "lucide-react";

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "~/shared/ui";
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-muted-foreground" />
          <CardTitle>Subscription</CardTitle>
          {isPro ? (
            <Badge>
              <Crown className="size-3" />
              Pro
            </Badge>
          ) : (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
        <CardDescription>
          {isPro ? "Manage your Pro subscription" : "Upgrade to unlock all features"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {status && (
          <div className="space-y-3">
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
        )}

        {isPro && status?.cancelAtPeriodEnd && (
          <p className="text-sm text-amber-500">
            Your subscription will end on{" "}
            {new Date(status.currentPeriodEnd!).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}

        {isPro && status?.status === "past_due" && (
          <p className="text-sm text-destructive">
            Your payment failed. Please update your payment method to continue using Pro features.
          </p>
        )}

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
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Pro includes</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1.5 ml-6">
                <li>500 extractions per month</li>
                <li>YouTube video extraction</li>
                <li>AI topic generation (50/month)</li>
              </ul>
            </div>
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
        )}
      </CardContent>
    </Card>
  );
};
