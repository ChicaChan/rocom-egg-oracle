import { Egg } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 px-8 py-16 text-center">
      <div className="rounded-full bg-primary/10 p-4 text-primary">
        <Egg className="size-7" />
      </div>
      <h3 className="text-base font-medium">输入蛋尺寸和重量开始反查</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        在游戏内打开「蛋」详情面板，将身高 (m) 与体重 (kg) 填入上方，
        会列出区间命中的精灵候选。也可以点上面的「快捷示例」直接试一组。
      </p>
    </div>
  );
}
