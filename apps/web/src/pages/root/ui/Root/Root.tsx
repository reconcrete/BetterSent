import { useState } from "react";
import {
  Link,
  LetterText,
  File as FileIcon,
  Youtube,
  BookOpen,
  Plus,
} from "lucide-react";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/shared/ui";
import { cn } from "~/shared/lib";

import { SendUrlWidget } from "~/widgets/sendUrlWidget";
import { SendTextWidget } from "~/widgets/sendTextWidget";
import { SendYoutubeWidget } from "~/widgets/sendYoutubeWidget";
import { SendTopicWidget } from "~/widgets/sendTopicWidget";
import { SendFileWidget } from "~/widgets/sendFileWidget";

export const Root = () => {
  const [activeTab, setActiveTab] = useState("url");

  const isOverflowActive =
    activeTab === "youtube" || activeTab === "topic";

  return (
    <div
      className="flex items-center justify-center px-4 md:px-0"
      style={{ minHeight: "calc(100vh - 7rem)" }}
    >
      <div className="w-full max-w-[598px]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="url" className="data-[state=active]:[&_svg]:text-primary">
              <Link className="size-3.5" />
              Link
            </TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:[&_svg]:text-[#B05EFF]">
              <LetterText className="size-3.5" />
              Plain Text
            </TabsTrigger>
            <TabsTrigger value="file" className="data-[state=active]:[&_svg]:text-[#22C55E]">
              <FileIcon className="size-3.5" />
              File
            </TabsTrigger>
            <TabsTrigger value="youtube" className="hidden md:inline-flex data-[state=active]:[&_svg]:text-[#EF4444]">
              <Youtube className="size-3.5" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="topic" className="hidden md:inline-flex data-[state=active]:[&_svg]:text-[#3F88FE]">
              <BookOpen className="size-3.5" />
              Topic
            </TabsTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "md:hidden inline-flex items-center rounded-t-[10px] p-4 transition-colors focus-visible:outline-none",
                    isOverflowActive
                      ? "border-l border-r border-t bg-white border-black/[0.06] text-foreground dark:bg-white/[0.02] dark:border-white/[0.06]"
                      : "text-[#747474]"
                  )}
                >
                  <Plus className="size-[15px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setActiveTab("youtube")}>
                  <Youtube className="size-3.5 text-[#EF4444]" />
                  YouTube
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab("topic")}>
                  <BookOpen className="size-3.5 text-[#3F88FE]" />
                  Topic
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>

          <TabsContent value="url" className="rounded-tr-[16px]">
            <SendUrlWidget />
          </TabsContent>
          <TabsContent value="text" className="rounded-t-[16px]">
            <SendTextWidget />
          </TabsContent>
          <TabsContent value="file" className="rounded-t-[16px]">
            <SendFileWidget />
          </TabsContent>
          <TabsContent
            value="youtube"
            className="rounded-tl-[16px] md:rounded-t-[16px]"
          >
            <SendYoutubeWidget />
          </TabsContent>
          <TabsContent value="topic" className="rounded-tl-[16px]">
            <SendTopicWidget />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
