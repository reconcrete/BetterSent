import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, FileText, LogOut } from "lucide-react";
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

export const Root = () => {
  const { data: session, isPending } = useSession();

  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
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
    } else {
      setText("");
    }
  };

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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "url" | "text")}>
            <TabsList className="w-full grid grid-cols-2 bg-neutral-100">
              <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-white">
                <Link className="size-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-white">
                <FileText className="size-4" />
                Plain Text
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
            content={activeTab === "url" ? url : text}
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
