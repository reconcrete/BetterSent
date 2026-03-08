import { InlineKeyboard } from "grammy";

interface Device {
  id: string;
  email: string;
  label: string | null;
}

export function buildDeviceKeyboard(devices: Device[], selectedId?: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  for (const device of devices) {
    const prefix = device.id === selectedId ? "✅ " : "";
    const label = device.label ? `${prefix}${device.label} (${device.email})` : `${prefix}${device.email}`;
    keyboard.text(label, `device_select:${device.id}`).row();
  }

  keyboard.text("➕ Add new device", "device_add_new");

  return keyboard;
}
