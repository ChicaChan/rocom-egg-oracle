const ITEMS = [
  {
    q: "数据从哪里来？覆盖多少精灵？",
    a: "目前来自「灵蛋所」（luokewangguofudan.wiki）：5 个预生成详情页提供 31 只精灵的真实蛋孵化区间（卡片左下标 ✓ 已验证），灵蛋所前端 worker.js 的成体数据再用换算系数（蛋约成体 0.42×）估算出剩余约 295 只精灵的蛋区间（卡片左下标 ~ 估算）。共覆盖约 326 只精灵。",
  },
  {
    q: "卡片上「已验证」和「估算」的区别？",
    a: "✓ 已验证：直接来自灵蛋所详情页 HTML 表格，数据与游戏内蛋面板严格一致。~ 估算：基于「精灵成体身高/体重 × 0.42」推算，单只精灵的实际蛋区间可能与估算值有 ±5% 的偏差。请优先信任 ✓ 已验证的候选。",
  },
  {
    q: "为什么我输入的尺寸 + 重量没有任何严格命中？",
    a: "可能是数值刚好在区间边缘外，或者灵蛋所还没有这只精灵。试试微调 ±0.01 m 或 ±0.1 kg；也可以查看下方的「邻近参考」看数值最接近的候选。",
  },
  {
    q: "结果排序的依据是什么？",
    a: "我们用「归一化中心距离」d = √(0.5·ds² + 0.5·dw²) 排序，离区间中心越近的精灵越靠前。平局时优先 ✓ 已验证。卡片右下角的「匹配度」就是 (1 − d) × 100%。",
  },
  {
    q: "排名跟灵蛋所详情页有些不一样？",
    a: "灵蛋所用内部的概率公式，对精灵的区间面积和先验权重略有调整。我们采用的归一化中心距离更适合做静态参考工具。两边的 Top-10 集合一般是一致的，只是顺序略有差异。",
  },
  {
    q: "卡片上 R = X kg/m 是什么意思？",
    a: "R 值 = 蛋重量 / 蛋尺寸（kg/m），是一个粗略的「密度」直觉。该值仅作为辅助展示，不参与排序。",
  },
  {
    q: "发现数据错误怎么办？",
    a: "欢迎到项目的 GitHub Issues 提交反馈，请附上精灵名、当前数值、你认为正确的数值，以及你确认这一区间的依据（游戏截图或官方公告）。我们会优先把估算的数据替换为玩家上报的真实区间。",
  },
];

export function Faq() {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">常见问题</h2>
      <ul className="space-y-2">
        {ITEMS.map((it) => (
          <li key={it.q}>
            <details className="group rounded-lg border bg-card/40 px-4 py-3 transition-colors hover:bg-card/60">
              <summary className="cursor-pointer list-none text-sm font-medium select-none flex items-center justify-between">
                <span>{it.q}</span>
                <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {it.a}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
