import { type FC, useState, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { Info } from "lucide-react";

import { FileDropZone } from "~/shared/ui";

import { SendContent } from "~/features/sendContent";
import { ChangePreselectedFile, type PreselectedFileDetails } from "~/features/changePreselectedFile";
import { ChooseDevice } from "~/features/chooseDevice";

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const ACCEPTED_FILE_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", "rtf", "htm", "html",
  "png", "gif", "jpg", "jpeg", "bmp", "epub",
  "md", "markdown",
];
const FILE_INPUT_ACCEPT = ACCEPTED_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const EMPTY_DETAILS: PreselectedFileDetails = { title: "", author: "" };

export const FileSender: FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [fileDetails, setFileDetails] = useState<Record<string, PreselectedFileDetails>>({});
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

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const accepted: File[] = [];
    const errors: string[] = [];
    for (const nextFile of Array.from(incoming)) {
      const validationError = validateFile(nextFile);
      if (validationError) {
        errors.push(`${nextFile.name}: ${validationError}`);
      } else {
        accepted.push(nextFile);
      }
    }
    setFiles((prev) => {
      const existingKeys = new Set(prev.map(fileKey));
      return [...prev, ...accepted.filter((file) => !existingKeys.has(fileKey(file)))];
    });
    setFileErrors(errors);
  };

  const removeFile = (file: File) => {
    setFiles((prev) => prev.filter((existing) => fileKey(existing) !== fileKey(file)));
    setFileDetails(({ [fileKey(file)]: _removed, ...rest }) => rest);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    event.target.value = "";
  };

  const handleFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const handleSuccess = () => {
    setFiles([]);
    setFileErrors([]);
    setFileDetails({});
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
            multiple
            accept={FILE_INPUT_ACCEPT}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </FileDropZone>

        {files.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {files.map((file) => (
              <ChangePreselectedFile
                key={fileKey(file)}
                file={file}
                details={fileDetails[fileKey(file)] ?? EMPTY_DETAILS}
                onDetailsChange={(details) =>
                  setFileDetails((prev) => ({ ...prev, [fileKey(file)]: details }))
                }
                onRemove={() => removeFile(file)}
              />
            ))}
          </ul>
        )}

        {fileErrors.length > 0 && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-xl space-y-1">
            {fileErrors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <ChooseDevice value={kindleId} onChange={handleKindleChange} />
      </div>

      <SendContent
        type="file"
        content={files}
        kindleEmailId={kindleId}
        getFileDetails={(file) => fileDetails[fileKey(file)] ?? EMPTY_DETAILS}
        onSuccess={handleSuccess}
      />
    </div>
  );
};
