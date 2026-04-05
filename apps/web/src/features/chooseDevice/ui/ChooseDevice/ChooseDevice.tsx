import { type FC, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { cn } from "~/shared/lib";
import { useSession } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";
import { ChooseDeviceSkeleton } from "../ChooseDeviceSkeleton/ChooseDeviceSkeleton";

type KindleEmail = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
};

interface ChooseDeviceProps {
  value: string | undefined;
  onChange: (kindleEmailId: string | undefined) => void;
}

export const ChooseDevice: FC<ChooseDeviceProps> = ({ value, onChange }) => {
  const { data: session } = useSession();

  const { data: devices } = useQuery({
    queryKey: ["kindleEmails"],
    queryFn: async () => {
      const response = await api.kindle.get();
      if (response.error) return [];
      return (response.data?.data ?? []) as KindleEmail[];
    },
    enabled: !!session,
  });

  const defaultDevice = devices?.find((d) => d.isDefault);

  useEffect(() => {
    if (!value && defaultDevice) {
      onChange(defaultDevice.id);
    }
  }, [value, defaultDevice, onChange]);

  if (!devices) return <ChooseDeviceSkeleton />;

  if (devices.length === 0) {
    return (
      <p className="text-sm text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 px-3 py-2 rounded-xl">
        Please add a Kindle email address in Settings before sending content.
      </p>
    );
  }

  if (devices.length === 1) {
    return (
      <p className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
        Sending to {devices[0].label || "Kindle"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center w-full">
        <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
          Send to
        </span>
      </div>

      <div className="flex w-full flex-wrap gap-2">
        {devices.map((device) => {
          const isSelected = device.id === value;

          return (
            <button
              key={device.id}
              type="button"
              onClick={() => onChange(device.id)}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-xl border py-3.5 pl-3.5 pr-5 transition-colors",
                isSelected
                  ? "bg-primary/[0.06] border-primary/15 dark:bg-primary/10 dark:border-primary/30"
                  : "bg-black/[0.02] border-black/[0.06] dark:bg-white/[0.05] dark:border-white/[0.08]",
              )}
            >
              <div
                className={cn(
                  "flex size-[18px] shrink-0 items-center justify-center rounded-[5px]",
                  isSelected
                    ? "bg-primary/55 dark:bg-primary"
                    : "border border-[#dadbd5] bg-white dark:border-[#555] dark:bg-transparent",
                )}
              >
                {isSelected && <Check className="size-[9px] text-primary-foreground" strokeWidth={3} />}
              </div>
              <span
                className={cn(
                  "text-[13px] font-medium",
                  isSelected
                    ? "text-secondary dark:text-foreground"
                    : "text-foreground",
                )}
              >
                {device.label || device.email}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
