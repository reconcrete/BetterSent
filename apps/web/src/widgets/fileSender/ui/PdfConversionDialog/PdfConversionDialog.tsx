import type { FC } from "react";
import { BookOpenText, FileText, Files } from "lucide-react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/shared/ui";

import type { PdfConversionMode } from "~/features/sendContent";

type PdfConversionDialogProps = {
  open: boolean;
  pdfCount: number;
  onSelect: (mode: PdfConversionMode) => void;
  onCancel: () => void;
};

export const PdfConversionDialog: FC<PdfConversionDialogProps> = ({
  open,
  pdfCount,
  onSelect,
  onCancel,
}) => (
  <Dialog
    open={open}
    onOpenChange={(nextOpen) => {
      if (!nextOpen) onCancel();
    }}
  >
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {pdfCount > 1 ? `Convert ${pdfCount} PDFs for Kindle?` : "Convert PDF for Kindle?"}
        </DialogTitle>
        <DialogDescription>
          PDFs keep their fixed layout on Kindle. Converting to EPUB makes the text reflow like a
          native book — adjustable font size, comfortable margins, and dark mode.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => onSelect("epub")}
          className="w-full justify-start rounded-xl py-3 h-auto font-semibold"
        >
          <BookOpenText className="size-4" />
          Send as native readable (EPUB)
        </Button>
        <Button
          variant="outline"
          onClick={() => onSelect("original")}
          className="w-full justify-start rounded-xl py-3 h-auto"
        >
          <FileText className="size-4" />
          No, send as PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => onSelect("both")}
          className="w-full justify-start rounded-xl py-3 h-auto"
        >
          <Files className="size-4" />
          Send both
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);
