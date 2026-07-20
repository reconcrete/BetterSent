import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { Check, ExternalLink } from "lucide-react";

import { HISTORY_URL, SETTINGS_URL, SIGN_IN_URL } from "@/shared/lib/env";
import { sendUrl } from "@/shared/lib/send";
import { api } from "@/shared/lib/treaty";
import { getUnsendableReason } from "@/shared/lib/urls";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";

type Device = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
};

type DevicesState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "error"; message: string }
  | { status: "ready"; devices: Device[] };

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent" }
  | { status: "error"; message: string };

type ActiveTab = { title: string | undefined; url: string | undefined };

const openInNewTab = (url: string) => {
  void browser.tabs.create({ url });
  window.close();
};

export const App = () => {
  const [tab, setTab] = useState<ActiveTab | null>(null);
  const [devicesState, setDevicesState] = useState<DevicesState>({ status: "loading" });
  // Applies to this send only — never persisted, never changes the account default.
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });
  // Left blank on purpose — the extractor infers better metadata than the raw
  // page title, so these only take effect when the user fills them in.
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");

  useEffect(() => {
    void browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([activeTab]) => setTab({ title: activeTab?.title, url: activeTab?.url }));
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await api.kindle.get();
        if (response.error) {
          if (response.error.status === 401) {
            setDevicesState({ status: "signedOut" });
          } else {
            setDevicesState({ status: "error", message: "Couldn't load your devices. Please try again." });
          }
          return;
        }
        const devices: Device[] = response.data?.data ?? [];
        setDevicesState({ status: "ready", devices });
        const preselected = devices.find((device) => device.isDefault) ?? devices[0];
        setSelectedDeviceId(preselected?.id);
      } catch {
        setDevicesState({
          status: "error",
          message: "Could not reach Bettersent. Check your connection and try again.",
        });
      }
    };
    void loadDevices();
  }, []);

  const handleSend = async () => {
    if (!tab?.url) return;
    setSendState({ status: "sending" });
    const result = await sendUrl(tab.url, selectedDeviceId, {
      title: bookTitle,
      author: bookAuthor,
    });
    if (result.ok) {
      setSendState({ status: "sent" });
    } else if (result.status === 401) {
      setDevicesState({ status: "signedOut" });
      setSendState({ status: "idle" });
    } else {
      setSendState({ status: "error", message: result.message });
    }
  };

  const unsendableReason = tab ? getUnsendableReason(tab.url) : null;
  const hostname = tab?.url && !unsendableReason ? new URL(tab.url).hostname : null;

  return (
    <div className="flex w-[340px] flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <img src="/icon/32.png" alt="" className="size-5 rounded" />
        <span className="text-sm font-semibold">Bettersent</span>
      </div>

      {devicesState.status === "loading" && (
        <div className="flex flex-col gap-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-9 animate-pulse rounded-md bg-muted" />
          <div className="h-9 animate-pulse rounded-md bg-muted" />
        </div>
      )}

      {devicesState.status === "signedOut" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Sign in to Bettersent to send pages to your Kindle.
          </p>
          <Button onClick={() => openInNewTab(SIGN_IN_URL)}>Sign in</Button>
        </div>
      )}

      {devicesState.status === "error" && (
        <p className="text-sm text-destructive">{devicesState.message}</p>
      )}

      {devicesState.status === "ready" && devicesState.devices.length === 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            You don't have any devices yet. Add your Kindle to start sending.
          </p>
          <Button onClick={() => openInNewTab(SETTINGS_URL)}>
            Add a device
            <ExternalLink />
          </Button>
        </div>
      )}

      {devicesState.status === "ready" && devicesState.devices.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="line-clamp-2 text-sm font-medium">{tab?.title || tab?.url || "Current page"}</p>
            {hostname && <p className="truncate text-xs text-muted-foreground">{hostname}</p>}
          </div>

          {unsendableReason ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{unsendableReason}</p>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
                Send to
              </span>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a device" />
                </SelectTrigger>
                <SelectContent>
                  {devicesState.devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.label || device.email}
                      {device.isDefault ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="mt-2 text-xs font-semibold uppercase tracking-[0.5px] text-muted-foreground">
                Book details
              </span>
              <Input
                placeholder="Book title (Optional)"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />
              <Input
                placeholder="Author (Optional)"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
              />
            </div>
          )}

          {sendState.status === "sent" ? (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <Check className="size-4 text-primary" strokeWidth={3} />
                Sent
              </span>
              <Button variant="link" size="sm" className="px-0" onClick={() => openInNewTab(HISTORY_URL)}>
                View in history
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => void handleSend()}
              disabled={!!unsendableReason || !tab?.url || sendState.status === "sending"}
            >
              {sendState.status === "sending" ? "Sending…" : "Send to Kindle"}
            </Button>
          )}

          {sendState.status === "error" && (
            <p className="text-sm text-destructive">{sendState.message}</p>
          )}
        </div>
      )}
    </div>
  );
};
