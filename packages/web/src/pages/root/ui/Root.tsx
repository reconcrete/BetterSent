import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, FileText, LogOut, Upload } from "lucide-react";
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
import { SendContent } from "~/features/sendContent";
import { KindleSettings } from "~/features/openKindleSettings";
import { OpenHistory } from "~/features/openHistory";
import { signOut, useSession } from "~/shared/lib";
import { api } from "~/shared/lib/treaty";
import { SignInWidget } from "~/widgets/signInWidget";

type KindleEmail = {
  id: string;
  email: string;
  label: string | null;
  isDefault: boolean;
};

const MAX_FILE_SIZE_MB = 25;
const SUPPORTED_EXTENSIONS = [
  "pdf", "doc", "docx", "txt", "rtf", "htm", "html",
  "png", "gif", "jpg", "jpeg", "bmp", "epub",
];

export const Root = () => {
  const { data: session, isPending } = useSession();

  const [activeTab, setActiveTab] = useState<"url" | "text" | "file">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedKindleId, setSelectedKindleId] = useState<string | undefined>(undefined);

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

  const getFileValidationError = useCallback((f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(", ")}`;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File too large. Max size is ${MAX_FILE_SIZE_MB} MB`;
    }
    return null;
  }, []);

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setFileError(null);
      const dropped = e.dataTransfer.files[0];
      if (!dropped) return;
      const err = getFileValidationError(dropped);
      if (err) {
        setFileError(err);
        setFile(null);
      } else {
        setFile(dropped);
      }
    },
    [getFileValidationError]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileError(null);
      const selected = e.target.files?.[0];
      e.target.value = "";
      if (!selected) return;
      const err = getFileValidationError(selected);
      if (err) {
        setFileError(err);
        setFile(null);
      } else {
        setFile(selected);
      }
    },
    [getFileValidationError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const handleSignOut = async () => {
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
    return <SignInWidget />;
  }

  // Show main app if logged in
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">Kindle Wrap</h1>
          <p className="text-neutral-500">Send articles and text to your Kindle device</p>
          <p className="text-sm text-neutral-400">
            Signed in as <span className="text-black">{session.user.email}</span>
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-6 space-y-5">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as "url" | "text" | "file");
              if (value !== "file") setFileError(null);
            }}
          >
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
                <Upload className="size-4" />
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

            <TabsContent value="file" className="mt-4 space-y-2">
              <div
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center"
              >
                <input
                  type="file"
                  accept={SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  {file ? (
                    <>
                      <p className="text-black font-medium">{file.name}</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        {(file.size / 1024).toFixed(1)} KB · Click or drop to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="size-10 mx-auto text-neutral-400" />
                      <p className="mt-2 text-black">Drop a file here or click to browse</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        PDF, DOC, DOCX, TXT, RTF, HTM, HTML, PNG, GIF, JPG, JPEG, BMP, EPUB
                      </p>
                      <p className="text-xs text-neutral-500">Max {MAX_FILE_SIZE_MB} MB</p>
                    </>
                  )}
                </label>
              </div>
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
            onError={activeTab === "file" ? setFileError : undefined}
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
