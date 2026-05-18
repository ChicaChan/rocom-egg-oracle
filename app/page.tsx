import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PredictorShell } from "@/components/predictor/PredictorShell";
import { getPets, getPetsMeta } from "@/lib/data/pets";

export default function Page() {
  const pets = getPets();
  const meta = getPetsMeta();

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-8">
        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="text-5xl" aria-hidden>
            🥚
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            输入蛋尺寸和重量，反查可孵精灵
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            数据来自灵蛋所详情页，目前覆盖 {meta.totalCount} 只精灵的真实蛋孵化阶段区间。
            算法只过滤严格命中精灵蛋区间的候选，并按归一化中心距离排序。
          </p>
        </section>

        <Suspense fallback={<div className="text-muted-foreground">加载中…</div>}>
          <PredictorShell pets={pets} totalCount={meta.totalCount} />
        </Suspense>

        <footer className="border-t pt-6 text-center text-xs text-muted-foreground space-y-1">
          <p>
            本工具基于公开蛋孵化区间数据做启发式匹配，仅供参考。
            数据来源：
            <a
              href="https://luokewangguofudan.wiki"
              className="underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              灵蛋所
            </a>
            。
          </p>
          <p>
            发现数据有误？欢迎在 GitHub Issues 提交反馈。
          </p>
        </footer>
      </main>
    </>
  );
}
