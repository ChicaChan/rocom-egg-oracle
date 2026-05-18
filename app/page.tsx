export default function Page() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center gap-4 p-8">
      <div className="text-6xl" aria-hidden>
        🥚
      </div>
      <h1 className="text-4xl font-bold tracking-tight">Rocom Egg Oracle</h1>
      <p className="text-muted-foreground text-balance max-w-md text-center">
        脚手架就绪。阶段 0 完成喵～接下来进入数据管线 v2。
      </p>
      <div className="flex gap-2 text-sm text-muted-foreground">
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1">Next.js 16</span>
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1">Tailwind v4</span>
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1">shadcn/ui</span>
      </div>
    </main>
  );
}
