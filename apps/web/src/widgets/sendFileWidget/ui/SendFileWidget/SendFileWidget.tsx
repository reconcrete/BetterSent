import { type FC, useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Upload } from "lucide-react";

import { SendContent } from "~/features/sendContent";

import { KindleEmailSelector } from "~/widgets/kindleEmailSelector";

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const ACCEPTED_FILE_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", "rtf", "htm", "html",
  "png", "gif", "jpg", "jpeg", "bmp", "epub",
];
const FILE_INPUT_ACCEPT = ACCEPTED_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export const SendFileWidget: FC = () => {
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
    <div className="mt-4 space-y-5">
      <div className="space-y-3">
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleFileDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
            isDragging
              ? "border-foreground bg-muted"
              : "border-border hover:border-foreground/30 hover:bg-accent"
          }`}
        >
          <Upload className="size-5 text-muted-foreground" />
          <p className="text-sm text-foreground">Drop a file here or click to choose</p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, TXT, RTF, HTM, HTML, PNG, GIF, JPG, JPEG, BMP, EPUB up to 200 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </label>

        {file && (
          <p className="text-sm text-muted-foreground">
            Selected: <span className="text-foreground">{file.name}</span>
          </p>
        )}

        {fileError && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {fileError}
          </p>
        )}
      </div>
      <KindleEmailSelector value={kindleId} onChange={handleKindleChange} />
      <SendContent type="file" content={file} kindleEmailId={kindleId} onSuccess={handleSuccess} />
    </div>
  );
};
