import * as p from "@clack/prompts";
import color from "picocolors";

import {
  createKindleEmail,
  deleteKindleEmail,
  getKindleEmails,
  setDefaultKindleEmail,
  updateKindleEmail,
  type KindleEmail,
} from "../api/client";
import { describeDevice, promptForDevice, validateKindleEmail } from "../lib/devices";
import { requireCredentials } from "../lib/session";

type Action = "add" | "edit" | "default" | "delete" | "done";

async function addDevice(token: string): Promise<void> {
  const email = await p.text({
    message: "Kindle email address",
    placeholder: "you@kindle.com",
    validate: validateKindleEmail,
  });
  if (p.isCancel(email)) return;

  const label = await p.text({
    message: "Label (optional)",
    placeholder: "Paperwhite",
  });
  if (p.isCancel(label)) return;

  const created = await createKindleEmail(token, email.trim(), label.trim() || undefined);
  if (!created.success) {
    p.log.error(created.error);
    return;
  }

  p.log.success(`Added ${describeDevice(created.data)}`);
}

async function editDevice(token: string, devices: KindleEmail[]): Promise<void> {
  const device = await promptForDevice(devices, "Edit which device?");
  if (!device) return;

  const email = await p.text({
    message: "Kindle email address",
    initialValue: device.email,
    validate: validateKindleEmail,
  });
  if (p.isCancel(email)) return;

  const label = await p.text({
    message: "Label (leave empty to remove)",
    initialValue: device.label ?? "",
  });
  if (p.isCancel(label)) return;

  const updated = await updateKindleEmail(token, device.id, {
    email: email.trim(),
    label: label.trim() || null,
  });
  if (!updated.success) {
    p.log.error(updated.error);
    return;
  }

  p.log.success(`Updated ${describeDevice(updated.data)}`);
}

async function chooseDefault(token: string, devices: KindleEmail[]): Promise<void> {
  const device = await promptForDevice(devices, "Which device should be the default?");
  if (!device) return;

  const updated = await setDefaultKindleEmail(token, device.id);
  if (!updated.success) {
    p.log.error(updated.error);
    return;
  }

  p.log.success(`${describeDevice(updated.data)} is now the default`);
}

async function removeDevice(token: string, devices: KindleEmail[]): Promise<void> {
  const device = await promptForDevice(devices, "Remove which device?");
  if (!device) return;

  const confirmed = await p.confirm({
    message: `Remove ${describeDevice(device)}?`,
    initialValue: false,
  });
  if (p.isCancel(confirmed) || !confirmed) return;

  const deleted = await deleteKindleEmail(token, device.id);
  if (!deleted.success) {
    p.log.error(deleted.error);
    return;
  }

  p.log.success("Device removed");
}

export async function setup(): Promise<number> {
  p.intro(color.bgCyan(color.black(" bettersent setup ")));

  const credentials = await requireCredentials();
  if (!credentials) return 1;

  const { token } = credentials;

  while (true) {
    const devices = await getKindleEmails(token);
    if (!devices.success) {
      p.cancel(devices.error);
      return 1;
    }

    if (devices.data.length === 0) {
      p.log.warn("You don't have any Kindle devices yet.");
    } else {
      p.log.info(
        `Your devices:\n${devices.data
          .map((device) => `  ${device.isDefault ? color.cyan("●") : color.dim("○")} ${describeDevice(device)}`)
          .join("\n")}`
      );
    }

    const hasDevices = devices.data.length > 0;

    const action = await p.select<Action>({
      message: "What would you like to do?",
      options: [
        { value: "add", label: "Add a device" },
        ...(hasDevices
          ? ([
              { value: "edit", label: "Edit a device" },
              { value: "default", label: "Set the default device" },
              { value: "delete", label: "Remove a device" },
            ] as const)
          : []),
        { value: "done", label: "Done" },
      ],
    });

    if (p.isCancel(action) || action === "done") {
      p.outro("Devices saved.");
      return 0;
    }

    if (action === "add") await addDevice(token);
    if (action === "edit") await editDevice(token, devices.data);
    if (action === "default") await chooseDefault(token, devices.data);
    if (action === "delete") await removeDevice(token, devices.data);
  }
}
