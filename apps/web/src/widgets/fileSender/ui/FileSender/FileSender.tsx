import { type FC, useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Info } from "lucide-react";

import { FileDropZone } from "~/shared/ui";

import { SendContent } from "~/features/sendContent";
import { ChooseDevice } from "~/features/chooseDevice";

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const ACCEPTED_FILE_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", "rtf", "htm", "html",
  "png", "gif", "jpg", "jpeg", "bmp", "epub",
];
const FILE_INPUT_ACCEPT = ACCEPTED_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export const FileSender: FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [kindleId, setKindleId] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (nextFile: File): string | null => {
    if (nextFile.size > MAX_FILE_SIZE_BYTES) {
      return "File size exceeds 200 MB limit.";
    }
    const extension = nextFile.name.split(".").pop()?.toLowerCase();
    if (!extension || !ACCEPTED_FILE_EXTENSIONS.includes(extension)) {
      return "Unsupported file type.";
    }
    return null;
  };

  const applyFile = (nextFile: File | null) => {
    if (!nextFile) return;
    const validationError = validateFile(nextFile);
    if (validationError) {
      setFile(null);
      setFileError(validationError);
      return;
    }
    setFile(nextFile);
    setFileError(null);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    applyFile(nextFile);
    event.target.value = "";
  };

  const handleFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const nextFile = event.dataTransfer.files?.[0] ?? null;
    applyFile(nextFile);
  };

  const handleSuccess = () => {
    setFile(null);
    setFileError(null);
  };

  const handleKindleChange = useCallback((id: string | undefined) => setKindleId(id), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5 justify-center">
        <Info className="size-[15px] shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Files are automatically formatted for the best Kindle reading experience
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <FileDropZone
          isDragging={isDragging}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleFileDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </FileDropZone>

        {file && (
          <p className="text-sm text-muted-foreground">
            Selected: <span className="text-foreground">{file.name}</span>
          </p>
        )}

        {fileError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
            {fileError}
          </p>
        )}

        <ChooseDevice value={kindleId} onChange={handleKindleChange} />
      </div>

      <SendContent type="file" content={file} kindleEmailId={kindleId} onSuccess={handleSuccess} />
    </div>
  );
};
