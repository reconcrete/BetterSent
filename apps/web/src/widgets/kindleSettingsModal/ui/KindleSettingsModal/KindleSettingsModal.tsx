import type { FC } from "react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "~/shared/ui";
import type { KindleSettingsModalProps } from "~/entities/modals/types";

import { KindleDeviceManager } from "~/widgets/kindleDeviceManager";

export const KindleSettingsModal: FC<KindleSettingsModalProps> = ({ closeModal }) => {
  return (
    <Dialog open onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Kindle Settings</DialogTitle>
          <DialogDescription>
            Manage your Kindle email addresses. Content will be sent to your default address.
          </DialogDescription>
        </DialogHeader>
        <KindleDeviceManager />
      </DialogContent>
    </Dialog>
  );
};
