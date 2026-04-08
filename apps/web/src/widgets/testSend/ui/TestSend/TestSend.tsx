import { useState, useCallback, type FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { api } from "~/shared/lib/treaty";
import { Button } from "~/shared/ui/Button/Button";
import { ChooseDevice } from "~/features/chooseDevice";

export const TestSend: FC = () => {
  const [kindleEmailId, setKindleEmailId] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await api.extract.test.post({ kindleEmailId });
      if (response.error) {
        throw new Error(
          typeof response.error === "object" && "error" in response.error
            ? (response.error as { error: string }).error
            : "Failed to send test EPUB",
        );
      }
      return response.data;
    },
  });

  const handleChange = useCallback((id: string | undefined) => {
    setKindleEmailId(id);
  }, []);

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Test Delivery
      </p>

      <div className="rounded-xl border bg-white px-5 py-5 dark:bg-white/5">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Send a test EPUB to your Kindle
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Sends a small test document to verify your Kindle delivery is
              working. No API credits used.
            </p>
          </div>

          <ChooseDevice value={kindleEmailId} onChange={handleChange} />

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !kindleEmailId}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {mutation.isPending ? "Sending..." : "Send Test Book"}
          </Button>

          {mutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              Test book sent! Check your Kindle in a few minutes.
            </div>
          )}

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {mutation.error.message}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-950/30">
        <p className="text-[13px] leading-relaxed text-amber-800 dark:text-amber-300/90">
          This sends a small "Welcome to Bettersent" document. Use it to
          confirm your Kindle email is correctly configured and that Amazon is
          delivering documents from Bettersent.
        </p>
      </div>
    </div>
  );
};
