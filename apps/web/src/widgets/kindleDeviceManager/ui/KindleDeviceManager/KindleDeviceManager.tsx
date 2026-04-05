import type { FC } from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star, Loader2, Mail, Info, Eye, EyeOff } from "lucide-react";

import { Button, Input } from "~/shared/ui";
import { cn } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";
import { useCreateDevice } from "~/entities/device";

type KindleEmail = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export const KindleDeviceManager: FC = () => {
  const [newEmail, setNewEmail] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState("");
  const [showEmails, setShowEmails] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: kindleEmails,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ["kindleEmails"],
    queryFn: async () => {
      const response = await api.kindle.get();
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to fetch Kindle emails";
        throw new Error(errorMessage);
      }
      return response.data?.data ?? [];
    },
  });

  const createMutation = useCreateDevice({
    onSuccess: () => {
      setNewEmail("");
      setNewLabel("");
      setError("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.kindle({ id }).delete();
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to delete Kindle email";
        throw new Error(errorMessage);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kindleEmails"] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.kindle({ id }).default.patch();
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to set default Kindle email";
        throw new Error(errorMessage);
      }
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kindleEmails"] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    if (!newEmail.trim().toLowerCase().endsWith("@kindle.com")) {
      setError("Please enter a valid Kindle email address (must end with @kindle.com)");
      return;
    }

    createMutation.mutate(
      { email: newEmail.trim(), label: newLabel.trim() || undefined },
      { onError: (err: Error) => setError(err.message) },
    );
  };

  const isPending =
    createMutation.isPending ||
    deleteMutation.isPending ||
    setDefaultMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Your Devices */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Your Devices
          </p>
          <button
            onClick={() => setShowEmails((v) => !v)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={showEmails ? "Hide emails" : "Show emails"}
            aria-label={showEmails ? "Hide emails" : "Show emails"}
          >
            {showEmails ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {showEmails ? "Hide" : "Show"}
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {fetchError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Failed to load Kindle emails
          </p>
        )}

        {!isLoading && !fetchError && kindleEmails?.length === 0 && (
          <div className="rounded-xl border bg-white px-5 py-8 text-center dark:bg-white/5">
            <Mail className="mx-auto mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No Kindle addresses yet</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Add your first Kindle email below
            </p>
          </div>
        )}

        {!isLoading && kindleEmails && kindleEmails.length > 0 && (
          <div className="space-y-2">
            {kindleEmails.map((kindle: KindleEmail) => (
              <div
                key={kindle.id}
                className="flex items-center gap-3 rounded-xl border bg-white px-5 py-4 dark:bg-white/5"
              >
                {kindle.isDefault ? (
                  <Star className="size-3.5 shrink-0 fill-amber-500 text-amber-500" />
                ) : (
                  <button
                    onClick={() => setDefaultMutation.mutate(kindle.id)}
                    disabled={isPending}
                    className="shrink-0 text-muted-foreground/30 transition-colors hover:text-amber-400 disabled:opacity-50"
                    title="Set as default"
                    aria-label="Set as default"
                  >
                    <Star className="size-3.5" />
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm font-medium text-foreground transition-[filter]",
                        !kindle.label && !showEmails && "blur-[3px] select-none",
                      )}
                    >
                      {kindle.label || kindle.email}
                    </span>
                    {kindle.isDefault && (
                      <span className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-secondary dark:text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  {kindle.label && (
                    <p
                      className={cn(
                        "truncate text-[13px] text-muted-foreground transition-[filter]",
                        !showEmails && "blur-[3px] select-none",
                      )}
                    >
                      {kindle.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(kindle.id)}
                  disabled={isPending}
                  className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 transition-colors hover:bg-destructive/5 hover:text-destructive disabled:opacity-50"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Device */}
      <div className="space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
          Add New Device
        </p>
        <form
          onSubmit={handleAddEmail}
          className="space-y-4 rounded-xl border bg-white p-5 dark:bg-white/5"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="kindle-email"
                className="text-[13px] font-medium text-foreground"
              >
                Kindle email
              </label>
              <Input
                id="kindle-email"
                type="email"
                placeholder="yourname@kindle.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="kindle-label"
                className="text-[13px] font-medium text-foreground"
              >
                Label (optional)
              </label>
              <Input
                id="kindle-label"
                type="text"
                placeholder="e.g., My Kindle Paperwhite"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={isPending || !newEmail.trim()}
            className="rounded-lg"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                Add Kindle Email
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Info callout */}
      <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/6 px-4 py-3.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Find your Kindle email in{" "}
          <span className="font-medium text-secondary dark:text-primary">
            Amazon &rarr; Manage Content and Devices &rarr; Preferences &rarr;
            Personal Document Settings
          </span>
        </p>
      </div>
    </div>
  );
};
