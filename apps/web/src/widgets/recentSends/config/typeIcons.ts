import { Link, FileText, File, Youtube, BookOpen } from "lucide-react";

export const typeIcons = {
  url: Link,
  text: FileText,
  file: File,
  youtube: Youtube,
  topic: BookOpen,
} as const;
