import * as p from "@clack/prompts";
import color from "picocolors";

import type { KindleEmail } from "../api/client";

export const describeDevice = (device: KindleEmail) =>
  device.label ? `${device.label} ${color.dim(`(${device.email})`)}` : device.email;

export const validateKindleEmail = (email: string): string | undefined => {
  const value = email.trim().toLowerCase();
  if (!value) return "Enter a Kindle email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "That doesn't look like an email address";
  if (!value.endsWith("@kindle.com")) return "A Kindle email address must end with @kindle.com";
  return undefined;
};

/** Prompts for one of the user's devices. Returns null if the user cancels. */
export async function promptForDevice(
  devices: KindleEmail[],
  message = "Send to which device?"
): Promise<KindleEmail | null> {
  const selected = await p.select({
    message,
    initialValue: devices.find((device) => device.isDefault)?.id ?? devices[0]?.id,
    options: devices.map((device) => ({
      value: device.id,
      label: describeDevice(device),
      hint: device.isDefault ? "default" : undefined,
    })),
  });

  if (p.isCancel(selected)) return null;
  return devices.find((device) => device.id === selected) ?? null;
}
