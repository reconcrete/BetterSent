import { type FC, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/ui";
import { useSession } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";

type KindleEmail = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
};

interface KindleEmailSelectorProps {
  value: string | undefined;
  onChange: (kindleEmailId: string | undefined) => void;
}

export const KindleEmailSelector: FC<KindleEmailSelectorProps> = ({ value, onChange }) => {
  const { data: session } = useSession();

  const { data: kindleEmails } = useQuery({
    queryKey: ["kindleEmails"],
    queryFn: async () => {
      const response = await api.kindle.get();
      if (response.error) return [];
      return (response.data?.data ?? []) as KindleEmail[];
    },
    enabled: !!session,
  });

  const defaultKindle = kindleEmails?.find((k) => k.isDefault);

  useEffect(() => {
    if (!value && defaultKindle) {
      onChange(defaultKindle.id);
    }
  }, [value, defaultKindle, onChange]);

  if (!kindleEmails) return null;

  if (kindleEmails.length === 0) {
    return (
      <p className="text-sm text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950 px-3 py-2 rounded-lg">
        Please add a Kindle email address in Settings before sending content.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Send to</label>
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v || undefined)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a Kindle device" />
        </SelectTrigger>
        <SelectContent>
          {kindleEmails.map((kindle) => (
            <SelectItem key={kindle.id} value={kindle.id}>
              {kindle.label || kindle.email}
              {kindle.isDefault ? " (default)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
