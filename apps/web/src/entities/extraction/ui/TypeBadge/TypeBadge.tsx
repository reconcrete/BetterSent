import type { FC } from "react";
import { Link, FileText, File, Youtube, BookOpen } from "lucide-react";

import { Badge } from "~/shared/ui";

type ExtractionType = "url" | "text" | "file" | "youtube" | "topic";

interface TypeBadgeProps {
  type: ExtractionType;
}

const typeConfig = {
  url: { icon: Link, label: "URL" },
  text: { icon: FileText, label: "Text" },
  youtube: { icon: Youtube, label: "YouTube" },
  topic: { icon: BookOpen, label: "Topic" },
  file: { icon: File, label: "File" },
} as const;

export const TypeBadge: FC<TypeBadgeProps> = ({ type }) => {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className="gap-1.5 text-muted-foreground">
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
};
