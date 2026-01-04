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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Kindle Wrap
          </h1>
          <p className="text-slate-400">
            Send articles and text to your Kindle device
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 space-y-5">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "url" | "text")}
          >
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="url" className="gap-2">
                <Link className="size-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
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
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
              />
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder="Paste your text content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
              />
            </TabsContent>
          </Tabs>

          <SendContent
            type={activeTab}
            content={activeTab === "url" ? url : text}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
};
