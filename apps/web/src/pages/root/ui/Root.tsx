import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, FileText, File as FileIcon, Upload, LogOut } from "lucide-react";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shared/ui";
import { api } from "~/shared/lib/treaty";
import { signOut, useSession, useAnalytics } from "~/shared/lib";

import { SendContent } from "~/features/sendContent";
import { KindleSettings } from "~/features/openKindleSettings";
import { OpenHistory } from "~/features/openHistory";

import { SignInCard } from "~/widgets/signInCard";

import { useOnboardingGuard } from "../hooks";

type KindleEmail = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
};

const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;
const ACCEPTED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "htm",
  "html",
  "png",
  "gif",
  "jpg",
  "jpeg",
  "bmp",
  "epub",
];
const FILE_INPUT_ACCEPT = ACCEPTED_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export const Root = () => {
  const { data: session, isPending } = useSession();
  const analytics = useAnalytics();
  
  useOnboardingGuard();

  const [activeTab, setActiveTab] = useState<"url" | "text" | "file">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedKindleId, setSelectedKindleId] = useState<string | undefined>(undefined);
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
    setIsDraggingFile(false);
    const nextFile = event.dataTransfer.files?.[0] ?? null;
    applyFile(nextFile);
  };

  // Fetch kindle emails for the selector
  const { data: kindleEmails } = useQuery({
    queryKey: ["kindleEmails"],
    queryFn: async () => {
      const response = await api.kindle.get();
      if (response.error) return [];
      return (response.data?.data ?? []) as KindleEmail[];
    },
    enabled: !!session,
  });

  // Set default kindle on initial load
  const defaultKindle = kindleEmails?.find((k) => k.isDefault);
  const effectiveKindleId = selectedKindleId ?? defaultKindle?.id;

  const handleSuccess = () => {
    if (activeTab === "url") {
      setUrl("");
    } else if (activeTab === "text") {
      setText("");
    } else {
      setFile(null);
      setFileError(null);
    }
  };

  const handleSignOut = async () => {
    analytics.reset();
    await signOut();
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  // Show auth widget if not logged in
  if (!session) {
    return <SignInCard />;
  }

  // Show main app if logged in
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">Bettersent</h1>
          <p className="text-neutral-500">Send articles and text to your Kindle device</p>
          <p className="text-sm text-neutral-400">
            Signed in as <span className="text-black">{session.user.email}</span>
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-6 space-y-5">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "url" | "text" | "file")}>
            <TabsList className="w-full grid grid-cols-3 bg-neutral-100">
              <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-white">
                <Link className="size-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-white">
                <FileText className="size-4" />
                Plain Text
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2 data-[state=active]:bg-white">
                <FileIcon className="size-4" />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="mt-4">
              <Input
                type="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border-neutral-200 text-black placeholder:text-neutral-400"
              />
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <textarea
                placeholder="Paste your text content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="w-full border border-neutral-200 rounded-md px-3 py-2 text-black placeholder:text-neutral-400 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </TabsContent>

            <TabsContent value="file" className="mt-4 space-y-3">
              <label
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDraggingFile(false);
                }}
                onDrop={handleFileDrop}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
                  isDraggingFile
                    ? "border-black bg-neutral-100"
                    : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                }`}
              >
                <Upload className="size-5 text-neutral-500" />
                <p className="text-sm text-black">Drop a file here or click to choose</p>
                <p className="text-xs text-neutral-500">
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
                <p className="text-sm text-neutral-600">
                  Selected: <span className="text-black">{file.name}</span>
                </p>
              )}

              {fileError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {fileError}
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Kindle selector */}
          {kindleEmails && kindleEmails.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Send to</label>
              <Select
                value={effectiveKindleId ?? ""}
                onValueChange={(value) => setSelectedKindleId(value || undefined)}
              >
                <SelectTrigger className="w-full border-neutral-200">
                  <SelectValue placeholder="Select a Kindle device" />
                </SelectTrigger>
                <SelectContent>
                  {kindleEmails.map((kindle) => (
                    <SelectItem key={kindle.id} value={kindle.id}>
                      {kindle.label || kindle.email}
                      {kindle.isDefault ? " (default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {kindleEmails && kindleEmails.length === 0 && (
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Please add a Kindle email address in Settings before sending content.
            </p>
          )}

          <SendContent
            type={activeTab}
            content={activeTab === "url" ? url : activeTab === "text" ? text : file}
            kindleEmailId={effectiveKindleId}
            onSuccess={handleSuccess}
          />
        </div>

        <div className="flex items-center justify-center gap-2">
          <KindleSettings />
          <OpenHistory />
          <Button variant="ghost" onClick={handleSignOut} className="text-neutral-500 hover:text-black">
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
