import { Badge } from "@/components/ui/badge";

export type DataFreshnessProps = {
  generatedAt: string;
  totalCount: number;
  staleCount: number;
};

function formatRelativeDate(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return "今天";
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return then.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export function DataFreshness({
  generatedAt,
  totalCount,
  staleCount,
}: DataFreshnessProps) {
  const isStale = staleCount > 0;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant={isStale ? "warning" : "outline"} className="font-normal">
        数据 · {formatRelativeDate(generatedAt)}
      </Badge>
      <span>覆盖 {totalCount} 只精灵</span>
      {isStale && (
        <span className="text-amber-600 dark:text-amber-400">
          · {staleCount} 条待更新
        </span>
      )}
    </div>
  );
}
