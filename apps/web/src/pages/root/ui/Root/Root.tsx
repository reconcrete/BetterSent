import { useState } from "react";
import { Link, FileText, File as FileIcon, Youtube, BookOpen, Lock } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/shared/ui";
import { useSubscriptionStatus } from "~/entities/billing";

import { SendUrlWidget } from "~/widgets/sendUrlWidget";
import { SendTextWidget } from "~/widgets/sendTextWidget";
import { SendYoutubeWidget } from "~/widgets/sendYoutubeWidget";
import { SendTopicWidget } from "~/widgets/sendTopicWidget";
import { SendFileWidget } from "~/widgets/sendFileWidget";

export const Root = () => {
  const [activeTab, setActiveTab] = useState("url");
  const { data: status } = useSubscriptionStatus();

  const isFree = !status || status.plan === "free";

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 7rem)" }}>
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Send to Kindle</h1>
          <p className="text-muted-foreground">Send articles and text to your Kindle device</p>
        </div>

        <div className="border border-border rounded-xl p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5 bg-muted">
              <TabsTrigger value="url" className="gap-2 data-[state=active]:bg-background">
                <Link className="size-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-background">
                <FileText className="size-4" />
                Plain Text
              </TabsTrigger>
              <TabsTrigger value="youtube" className="gap-2 data-[state=active]:bg-background">
                {isFree ? <Lock className="size-3.5" /> : <Youtube className="size-4" />}
                YouTube
              </TabsTrigger>
              <TabsTrigger value="topic" className="gap-2 data-[state=active]:bg-background">
                {isFree ? <Lock className="size-3.5" /> : <BookOpen className="size-4" />}
                Topic
              </TabsTrigger>
              <TabsTrigger value="file" className="gap-2 data-[state=active]:bg-background">
                <FileIcon className="size-4" />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url"><SendUrlWidget /></TabsContent>
            <TabsContent value="text"><SendTextWidget /></TabsContent>
            <TabsContent value="youtube"><SendYoutubeWidget /></TabsContent>
            <TabsContent value="topic"><SendTopicWidget /></TabsContent>
            <TabsContent value="file"><SendFileWidget /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
