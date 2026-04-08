export type HistoryItem = {
  id: string;
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string;
  title: string | null;
  author: string | null;
  status: "pending" | "processing" | "completed" | "error";
  errorMessage: string | null;
  kindleLabel: string | null;
  hasPreview: boolean;
  createdAt: string;
  updatedAt: string;
};
