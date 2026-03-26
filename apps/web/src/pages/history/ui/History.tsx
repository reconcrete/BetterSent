import type { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Link, FileText, File, Loader2, CheckCircle2, XCircle, Clock, Youtube, BookOpen } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
} from "~/shared/ui";
import { api } from "~/shared/lib/treaty";
import { useSession } from "~/shared/lib";
import { PreviewExtraction } from "~/features/previewExtraction";

type HistoryItem = {
  id: string;
  type: "url" | "text" | "file" | "youtube" | "topic";
  content: string;
  title: string | null;
  author: string | null;
  status: "pending" | "processing" | "completed" | "error";
  errorMessage: string | null;
  kindleEmail: string | null;
  hasPreview: boolean;
  createdAt: string;
  updatedAt: string;
};

const StatusBadge: FC<{ status: HistoryItem["status"]; errorMessage?: string | null }> = ({
  status,
  errorMessage,
}) => {
  const statusConfig = {
    pending: {
      icon: Clock,
      label: "Pending",
      className: "bg-muted text-muted-foreground",
    },
    processing: {
      icon: Loader2,
      label: "Processing",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },
    completed: {
      icon: CheckCircle2,
      label: "Completed",
      className: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    },
    error: {
      icon: XCircle,
      label: "Error",
      className: "bg-destructive/10 text-destructive",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="group relative inline-block">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        <Icon className={`size-3.5 ${status === "processing" ? "animate-spin" : ""}`} />
        {config.label}
      </span>
      {status === "error" && errorMessage && (
        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 p-2 text-xs bg-foreground text-background rounded-lg shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

const TypeBadge: FC<{ type: HistoryItem["type"] }> = ({ type }) => {
  const Icon = type === "url" ? Link : type === "text" ? FileText : type === "youtube" ? Youtube : type === "topic" ? BookOpen : File;
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Icon className="size-4" />
      {type === "url" ? "URL" : type === "text" ? "Text" : type === "youtube" ? "YouTube" : type === "topic" ? "Topic" : "File"}
    </span>
  );
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const truncateContent = (content: string, maxLength = 50): string => {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
};

export const History: FC = () => {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = useSession();

  const { data: historyItems, isLoading } = useQuery({
    queryKey: ["sendHistory"],
    queryFn: async () => {
      const response = await api.history.get();
      if (response.error) return [];
      return (response.data?.data ?? []) as HistoryItem[];
    },
    enabled: !!session,
    refetchInterval: 5000, // Poll every 5s to catch status updates
  });

  if (isSessionPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Please sign in</h1>
          <p className="text-muted-foreground">You need to be signed in to view your history.</p>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Send History</h1>
          <p className="text-muted-foreground">
            Track what you've sent to your Kindle device
          </p>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="size-6 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading history...</p>
            </div>
          ) : historyItems && historyItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="w-[200px]">Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kindle</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-[200px]">
                        <div className="truncate" title={item.title || item.content}>
                          {item.title || truncateContent(item.content)}
                        </div>
                        {item.author && (
                          <div className="text-xs text-muted-foreground truncate">
                            by {item.author}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={item.type} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} errorMessage={item.errorMessage} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.kindleEmail ? (
                        <span className="text-sm truncate max-w-[150px] block">
                          {item.kindleEmail}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell>
                      {item.hasPreview && (
                        <PreviewExtraction historyId={item.id} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No history yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Content you send to your Kindle will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
