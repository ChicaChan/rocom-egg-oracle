import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PredictorShell } from "@/components/predictor/PredictorShell";
import { HeroDecor } from "@/components/decor/HeroDecor";
import { EggIcon } from "@/components/decor/EggIcon";
import { DataFreshness } from "@/components/predictor/DataFreshness";
import { Faq } from "@/components/predictor/Faq";
import { getPets, getPetsMeta } from "@/lib/data/pets";

export default function Page() {
  const pets = getPets();
  const meta = getPetsMeta();
  const staleCount = Object.values(meta.sources).filter((s) => s.stale).length;

  return (
    <>
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-10">
        {/* Hero with decoration */}
        <section className="relative text-center space-y-4 py-6">
          <HeroDecor />
          <div className="flex justify-center motion-safe:animate-[float_4s_ease-in-out_infinite]">
            <EggIcon size={88} cracked />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            输入蛋尺寸和重量，反查可孵精灵
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground text-balance">
            数据来自灵蛋所详情页，蛋孵化阶段的真实区间，硬过滤命中后按归一化中心距离排序。
          </p>
          <div className="flex justify-center">
            <DataFreshness
              generatedAt={meta.generatedAt}
              totalCount={meta.totalCount}
              staleCount={staleCount}
            />
          </div>
        </section>

        <Suspense fallback={<div className="text-muted-foreground">加载中…</div>}>
          <PredictorShell pets={pets} totalCount={meta.totalCount} />
        </Suspense>

        <Faq />

        <footer className="border-t pt-6 text-center text-xs text-muted-foreground space-y-2">
          <p>
            本工具基于公开蛋孵化区间数据做启发式匹配，仅供参考。
            数据来源：
            <a
              href="https://luokewangguofudan.wiki"
              className="underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              灵蛋所
            </a>
            。
          </p>
          <p>
            发现数据有误？欢迎在{" "}
            <a
              href="https://github.com/ChicaChan/rocom-egg-oracle/issues"
              className="underline underline-offset-2 hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Issues
            </a>{" "}
            提交反馈。
          </p>
        </footer>
      </main>
    </>
  );
}
