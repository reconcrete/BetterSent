import type { FC } from "react";
import { Send, Link, FileText, Type, Sparkles } from "lucide-react";
import { Button } from "~/shared/ui";

type WelcomeStepProps = {
  onNext: () => void;
};

const features = [
  {
    icon: Link,
    title: "Send any URL",
    description: "Articles, blog posts, and web pages",
  },
  {
    icon: FileText,
    title: "Send documents",
    description: "PDFs, EPUBs, and text files",
  },
  {
    icon: Type,
    title: "Send plain text",
    description: "Notes, excerpts, and custom content",
  },
  {
    icon: Sparkles,
    title: "Generate Books",
    description: "Create minibooks on topics you are interested in",
  },
];

export const WelcomeStep: FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="flex flex-col gap-3 items-center">
        <div className="size-14 rounded-2xl bg-primary/15 dark:bg-primary/10 flex items-center justify-center">
          <Send className="size-6 text-secondary dark:text-primary" />
        </div>
        <div className="flex flex-col gap-1 items-center text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome to bettersent
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-[400px]">
            Send articles, documents, and text straight to your Kindle.
            We just need a quick setup first.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3.5 w-full">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-3.5 items-center">
            <div className="size-9 rounded-xl bg-primary/15 dark:bg-primary/10 flex items-center justify-center shrink-0">
              <feature.icon className="size-[18px] text-secondary dark:text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">
                {feature.title}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={onNext}
        className="w-full h-12 rounded-xl text-sm font-semibold"
      >
        Get Started
      </Button>
    </div>
  );
};
