import type { FC } from "react";
import { Tablet, User, CreditCard } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "~/shared/ui";
import { useSession } from "~/shared/lib";

import { KindleDeviceManager } from "~/widgets/kindleDeviceManager";

export const Settings: FC = () => {
  const { data: session } = useSession();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your devices and account</p>
      </div>

      {/* Kindle Devices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tablet className="size-5 text-muted-foreground" />
            <CardTitle>Kindle Devices</CardTitle>
          </div>
          <CardDescription>
            Add and manage your Kindle email addresses. Content will be sent to your default device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KindleDeviceManager />
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="size-5 text-muted-foreground" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Email</p>
              <p className="text-sm text-muted-foreground">{session?.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-muted-foreground" />
            <CardTitle>Subscription</CardTitle>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
          <CardDescription>
            Manage your subscription plan and billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Subscription management will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
