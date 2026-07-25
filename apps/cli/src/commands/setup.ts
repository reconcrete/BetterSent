import * as p from "@clack/prompts";

import { apiErrorMessage, createApi, type ApiClient } from "../api";
import { readConfig } from "../config";

type Device = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const fail = (message: string): never => {
  p.cancel(message);
  process.exit(1);
};

const cancelled = (value: unknown): value is symbol => p.isCancel(value);

const fetchDevices = async (api: ApiClient): Promise<Device[]> => {
  const { data, error } = await api.kindle.get();
  if (error || !data?.success) return fail(apiErrorMessage(error));
  return data.data;
};

const describe = (device: Device): string =>
  `${device.label || device.email}${device.label ? ` <${device.email}>` : ""}${device.isDefault ? " (default)" : ""}`;

const pickDevice = async (devices: Device[], message: string): Promise<Device | null> => {
  const picked = await p.select({
    message,
    options: devices.map((device) => ({ value: device.id, label: describe(device) })),
  });
  if (cancelled(picked)) return null;
  return devices.find((device) => device.id === picked) ?? null;
};

const promptEmail = async (initialValue?: string): Promise<string | null> => {
  const email = await p.text({
    message: "Kindle email address (usually ...@kindle.com)",
    initialValue,
    validate: (value) => {
      if (!value || !EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
    },
  });
  if (cancelled(email)) return null;
  return (email as string).trim();
};

const promptLabel = async (initialValue?: string): Promise<string | null | symbol> => {
  const label = await p.text({
    message: "Label (optional, e.g. \"Paperwhite\")",
    initialValue,
    defaultValue: "",
  });
  if (cancelled(label)) return label;
  const trimmed = (label as string).trim();
  return trimmed || null;
};

const addDevice = async (api: ApiClient, existing: Device[]): Promise<void> => {
  const email = await promptEmail();
  if (email === null) return;

  const label = await promptLabel();
  if (typeof label === "symbol") return;

  // The first device becomes the default automatically; otherwise ask.
  let isDefault = existing.length === 0;
  if (!isDefault) {
    const answer = await p.confirm({ message: "Make this the default device?", initialValue: false });
    if (cancelled(answer)) return;
    isDefault = answer;
  }

  const { data, error } = await api.kindle.post({ email, label: label ?? undefined, isDefault });
  if (error || !data?.success) {
    p.log.error(apiErrorMessage(error));
    return;
  }
  p.log.success(`Added ${email}.`);
};

const editDevice = async (api: ApiClient, devices: Device[]): Promise<void> => {
  const device = await pickDevice(devices, "Edit which device?");
  if (!device) return;

  const email = await promptEmail(device.email);
  if (email === null) return;

  const label = await promptLabel(device.label ?? undefined);
  if (typeof label === "symbol") return;

  const { data, error } = await api.kindle({ id: device.id }).patch({ email, label });
  if (error || !data?.success) {
    p.log.error(apiErrorMessage(error));
    return;
  }
  p.log.success(`Updated ${email}.`);
};

const setDefaultDevice = async (api: ApiClient, devices: Device[]): Promise<void> => {
  const device = await pickDevice(devices, "Which device should be the default?");
  if (!device) return;

  const { data, error } = await api.kindle({ id: device.id }).default.patch();
  if (error || !data?.success) {
    p.log.error(apiErrorMessage(error));
    return;
  }
  p.log.success(`${device.label || device.email} is now the default.`);
};

const removeDevice = async (api: ApiClient, devices: Device[]): Promise<void> => {
  const device = await pickDevice(devices, "Remove which device?");
  if (!device) return;

  const confirmed = await p.confirm({
    message: `Remove ${describe(device)}?`,
    initialValue: false,
  });
  if (cancelled(confirmed) || !confirmed) return;

  const { data, error } = await api.kindle({ id: device.id }).delete();
  if (error || !data?.success) {
    p.log.error(apiErrorMessage(error));
    return;
  }
  p.log.success(`Removed ${device.email}.`);
};

export const setup = async (): Promise<void> => {
  if (!readConfig()) {
    fail("Not logged in. Run `bettersent login` first.");
  }

  const api = createApi();

  p.intro("bettersent setup");

  while (true) {
    const devices = await fetchDevices(api);

    if (devices.length === 0) {
      p.log.message("No devices configured yet.");
    } else {
      p.log.message(devices.map((device) => `• ${describe(device)}`).join("\n"));
    }

    const action = await p.select({
      message: "What would you like to do?",
      options: [
        { value: "add", label: "Add a device" },
        ...(devices.length > 0
          ? [
              { value: "edit", label: "Edit a device" },
              { value: "default", label: "Change the default device" },
              { value: "remove", label: "Remove a device" },
            ]
          : []),
        { value: "done", label: "Done" },
      ],
    });

    if (cancelled(action) || action === "done") {
      p.outro("Setup finished.");
      return;
    }

    if (action === "add") await addDevice(api, devices);
    if (action === "edit") await editDevice(api, devices);
    if (action === "default") await setDefaultDevice(api, devices);
    if (action === "remove") await removeDevice(api, devices);
  }
};
