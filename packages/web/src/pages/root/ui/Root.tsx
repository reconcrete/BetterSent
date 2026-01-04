import { useState } from "react";
import { Link, FileText } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea } from "~/shared/ui";
import { SendContent } from "~/features/sendContent";

export const Root = () => {
  const [activeTab, setActiveTab] = useState<"url" | "text">("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  const handleSuccess = () => {
    if (activeTab === "url") {
      setUrl("");
    } else {
      setText("");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-black">Kindle Wrap</h1>
          <p className="text-neutral-500">Send articles and text to your Kindle device</p>
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
              <Textarea
                placeholder="Paste your text content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="border-neutral-200 text-black placeholder:text-neutral-400 resize-none"
              />
            </TabsContent>
          </Tabs>

          <SendContent type={activeTab} content={activeTab === "url" ? url : text} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};
