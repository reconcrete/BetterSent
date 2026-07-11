import { type FC, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

import { Button, Pagination } from "~/shared/ui";

import { PreviewExtraction } from "~/features/previewExtraction";
import { ViewReferences } from "~/features/viewReferences";
import { useSendHistory } from "~/entities/sendHistory";
import { RecentSendRow, RecentSendsSkeleton } from "~/widgets/recentSends";

const PAGE_SIZE = 10;

const EmptyHistoryState: FC = () => (
  <div className="text-center py-16 space-y-4">
    <BookOpen className="size-12 mx-auto text-muted-foreground/50" />
    <div className="space-y-2">
      <h2 className="text-lg font-medium text-foreground">No history yet</h2>
      <p className="text-sm text-muted-foreground">Content you send to your Kindle will appear here.</p>
    </div>
    <Button asChild>
      <Link to="/">Send your first article</Link>
    </Button>
  </div>
);

export const History: FC = () => {
  const [page, setPage] = useState(1);
  const { data: historyPage, isLoading } = useSendHistory({ page, pageSize: PAGE_SIZE });

  const items = historyPage?.items;

  return (
    <div className="max-w-2xl mx-auto pt-6 space-y-6">
      <h1 className="text-[22px] font-bold leading-snug text-foreground md:hidden">Send History</h1>

      {isLoading && <RecentSendsSkeleton />}

      {!isLoading && items?.length === 0 && <EmptyHistoryState />}

      {!isLoading && items && items.length > 0 && (
        <div>
          {items.map((item, i) => (
            <RecentSendRow
              key={item.id}
              item={item}
              isFirst={i === 0}
              action={
                (item.hasPreview || item.references.length > 0) ? (
                  <>
                    {item.hasPreview && <PreviewExtraction historyId={item.id} />}
                    {item.references.length > 0 && <ViewReferences references={item.references} />}
                  </>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {!isLoading && historyPage && (
        <Pagination
          page={historyPage.page}
          totalPages={historyPage.totalPages}
          onPageChange={setPage}
          className="pb-6"
        />
      )}
    </div>
  );
};
