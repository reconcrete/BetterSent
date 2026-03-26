import type { FC } from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Star, Loader2 as Loader, Mail } from "lucide-react";

import { Button, Input } from "~/shared/ui";
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
      {/* Add new email form */}
      <form onSubmit={handleAddEmail} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="kindle-email" className="text-sm font-medium text-foreground">
            Kindle Email
          </label>
          <Input
            id="kindle-email"
            type="email"
            placeholder="your-kindle@kindle.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="kindle-label" className="text-sm font-medium text-foreground">
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
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={isPending || !newEmail.trim()}>
          {createMutation.isPending ? (
            <>
              <Loader className="animate-spin size-4" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Add Kindle Email
            </>
          )}
        </Button>
      </form>

      {/* Email list */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Your Kindle Addresses</h3>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin size-6 text-muted-foreground" />
          </div>
        )}

        {fetchError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            Failed to load Kindle emails
          </p>
        )}

        {!isLoading && !fetchError && kindleEmails?.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Kindle addresses yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first Kindle email above
            </p>
          </div>
        )}

        {!isLoading && kindleEmails && kindleEmails.length > 0 && (
          <ul className="space-y-2">
            {kindleEmails.map((kindle: KindleEmail) => (
              <li
                key={kindle.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {kindle.isDefault && (
                      <Star className="size-4 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {kindle.label || kindle.email}
                    </span>
                  </div>
                  {kindle.label && (
                    <p className="text-xs text-muted-foreground truncate">
                      {kindle.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {!kindle.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDefaultMutation.mutate(kindle.id)}
                      disabled={isPending}
                      title="Set as default"
                      aria-label="Set as default"
                    >
                      <Star className="size-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteMutation.mutate(kindle.id)}
                    disabled={isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
