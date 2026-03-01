import type { FC } from "react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Star,
  Loader2 as Loader,
  Mail,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

import { Button, Input } from "~/shared/ui";
import { api } from "~/shared/lib/treaty";
import type { KindleSettingsModalProps } from "~/entities/modals/types";

type KindleEmail = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export const KindleSettingsModal: FC<KindleSettingsModalProps> = ({
  closeModal,
}) => {
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

  const createMutation = useMutation({
    mutationFn: async ({ email, label }: { email: string; label?: string }) => {
      const response = await api.kindle.post({ email, label });
      if (response.error) {
        const errorValue = response.error.value;
        const errorMessage =
          typeof errorValue === "object" && errorValue && "error" in errorValue
            ? errorValue.error
            : "Failed to create Kindle email";
        throw new Error(errorMessage);
      }
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kindleEmails"] });
      setNewEmail("");
      setNewLabel("");
      setError("");
    },
    onError: (err: Error) => {
      setError(err.message);
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

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    createMutation.mutate({
      email: newEmail.trim(),
      label: newLabel.trim() || undefined,
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  const isPending =
    createMutation.isPending ||
    deleteMutation.isPending ||
    setDefaultMutation.isPending;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && closeModal()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl border border-neutral-200 shadow-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-xl font-bold text-black">
            Kindle Settings
          </Dialog.Title>
          <Dialog.Description className="text-sm text-neutral-500 mt-1 mb-4">
            Manage your Kindle email addresses. Content will be sent to your
            default address.
          </Dialog.Description>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-neutral-400 hover:text-black transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>

          {/* Add new email form */}
          <form onSubmit={handleAddEmail} className="space-y-3 mb-6">
            <div className="space-y-2">
              <label
                htmlFor="kindle-email"
                className="text-sm font-medium text-black"
              >
                Kindle Email
              </label>
              <Input
                id="kindle-email"
                type="email"
                placeholder="your-kindle@kindle.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="border-neutral-200 text-black placeholder:text-neutral-400"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="kindle-label"
                className="text-sm font-medium text-black"
              >
                Label (optional)
              </label>
              <Input
                id="kindle-label"
                type="text"
                placeholder="e.g., My Kindle Paperwhite"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="border-neutral-200 text-black placeholder:text-neutral-400"
                disabled={isPending}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-neutral-800"
              disabled={isPending || !newEmail.trim()}
            >
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
            <h3 className="text-sm font-medium text-black">
              Your Kindle Addresses
            </h3>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin size-6 text-neutral-400" />
              </div>
            )}

            {fetchError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                Failed to load Kindle emails
              </p>
            )}

            {!isLoading && !fetchError && kindleEmails?.length === 0 && (
              <div className="text-center py-8 text-neutral-500">
                <Mail className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No Kindle addresses yet</p>
                <p className="text-xs text-neutral-400 mt-1">
                  Add your first Kindle email above
                </p>
              </div>
            )}

            {!isLoading && kindleEmails && kindleEmails.length > 0 && (
              <ul className="space-y-2">
                {kindleEmails.map((kindle: KindleEmail) => (
                  <li
                    key={kindle.id}
                    className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {kindle.isDefault && (
                          <Star className="size-4 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                        <span className="text-sm font-medium text-black truncate">
                          {kindle.label || kindle.email}
                        </span>
                      </div>
                      {kindle.label && (
                        <p className="text-xs text-neutral-500 truncate">
                          {kindle.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!kindle.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleSetDefault(kindle.id)}
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
                        onClick={() => handleDelete(kindle.id)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
