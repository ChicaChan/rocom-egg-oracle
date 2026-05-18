# Rocom Egg Oracle

> 输入蛋尺寸和重量，反查可能孵出的《洛克王国：世界》精灵。

Rocom Egg Oracle 是一个面向 Rocom 玩家的开源孵蛋反查工具。基于公开的「蛋孵化阶段」尺寸/重量区间，对玩家从游戏内蛋面板抄到的两个数字进行硬过滤匹配，并按归一化中心距离排序给出 Top 10 候选。

![Screenshot](./public/screenshots/egg-prediction-example.png)

## 项目特性

- **真实的蛋阶段区间**：数据来自[灵蛋所](https://luokewangguofudan.wiki)详情页，与游戏内蛋面板显示的尺寸/重量同语义（不是精灵成体身高）。
- **硬过滤算法**：精灵的蛋区间必须同时包含输入 size 和 weight 才会进入候选，符合社区共识。
- **归一化中心距离排序**：`d = √(0.5·ds² + 0.5·dw²)`，越靠区间中心越靠前；玩家可读的「极有可能 / 很可能 / 可能 / 边缘命中」分级。
- **滑块 + 数字双向绑定**：拖动毫秒级刷新结果，URL 参数实时同步，可分享回填。
- **第 1/2/3 名差异化卡片**：金/银/铜排名徽章，第 1 名 hero 大卡 + glow-pulse，第 2-3 中卡，其余紧凑列表。
- **多源数据可追溯**：每个候选卡片底部显示来源 Badge 和数据质量等级，便于玩家判断置信度。
- **暗色模式 + Motion 友好**：所有动画 `motion-safe:` 限定，`prefers-reduced-motion` 自动降级。

## 在线演示

部署到[原域名](https://rocom.eu.cc)（3010 端口）。也可以本地或自部署。

## 数据来源

**主源**：[灵蛋所](https://luokewangguofudan.wiki) 公开的 `/egg-size/*` 详情页 HTML 表格。

每条记录都带 `sources[]`，可追溯到具体的灵蛋所详情页 URL 和抓取时间。当前覆盖约 30+ 只精灵，会随灵蛋所扩展其详情页而增加。

**元数据增强**：从灵蛋所前端 `worker.js` 内嵌的精灵库提取 358 条元数据（拼音、属性类、image webp、蛋组、异色），按精灵名匹配补全已抓取条目的 `pinyin / category / eggGroupIds / luodanImage / isShiny` 字段——**不覆盖** size/weight 区间（worker.js 中的 height/weight 是精灵成体数据，与蛋阶段语义不符）。

**为什么不再用 BWIKI**：之前从 BWIKI「精灵图鉴」详情页抓取的"身高/体重"实际上是**精灵成体**的尺寸/重量，而游戏内蛋面板显示的是蛋孵化阶段的尺寸/重量（约成体的 0.4 倍）。旧 322 条数据与蛋查询语义错位，已弃用。

刷新数据：

```bash
npm run data:update     # extract-luodan → fetch-luodan-details → build-pets → validate
```

数据生成产物：

```text
data/pets.json          主数据（zod 校验过）
data/pets.meta.json     版本 / 生成时间 / 来源覆盖 / 质量分布
scripts/reports/*.md    本次抓取的离群清单、质量报告
scripts/.cache/luodan/  灵蛋所抓取缓存（gitignored）
```

## 算法白皮书

### 一级硬过滤

精灵的 `size` 和 `weight` 区间必须**同时**包含输入：

```text
size.minM   ≤ 输入尺寸 ≤ size.maxM
weight.minKg ≤ 输入重量 ≤ weight.maxKg
```

任一不满足，该精灵进入「邻近参考」通道（不参与 Top N 排名，只展示数值最接近的 5 个）。

### 二级归一化中心距离排序

对每个硬命中的精灵，计算：

```text
ds = |输入尺寸 - 区间中心尺寸| / (区间半宽尺寸)     ∈ [0, 1]
dw = |输入重量 - 区间中心重量| / (区间半宽重量)     ∈ [0, 1]
distance = √(0.5·ds² + 0.5·dw²)                  ∈ [0, ~1.41]
matchScore = (1 - distance) × 100%                ∈ [0, 100]
```

距离越小越靠前。

### 置信度分级

| distance | level | 文案 |
|---|---|---|
| ≤ 0.05 | exact | 极有可能 |
| ≤ 0.30 | high | 很可能 |
| ≤ 0.60 | medium | 可能 |
| ≤ 1.00 | low | 边缘命中 |
| > 1.00 | edge | 越界参考（仅 nearby 通道） |

### 平局规则

距离相同时按 `dataQuality > name.localeCompare("zh-Hans-CN")`：

```text
verified > single-source > user-reported > inferred → 中文名升序
```

### 与灵蛋所的差异

灵蛋所用内部的概率公式（含区间面积/先验权重），Rocom Egg Oracle 用归一化中心距离。**两边的 Top-10 集合一般完全一致**，只是顺序略有差异。R 值（重量/尺寸）仅作为辅助展示出现在第 1 名卡片，不参与排序。

详细实现见 `lib/predict/{filter,score,confidence}.ts`，覆盖 46 个 vitest 单测。

## 技术栈

- **Next.js 16** + App Router + Turbopack
- **React 19** + Server Components
- **TypeScript 5** + zod 4 schema 单一真相源
- **Tailwind CSS v4** + shadcn/ui (`new-york` style)
- **Radix UI** (slider / tooltip / slot)
- **next-themes** 暗色模式 / **Sonner** Toast
- **Vitest 4** 单测
- **cheerio** + **p-retry** 数据抓取
- **Docker** + **systemd** + **Nginx** 部署模板

## 快速开始

要求：Node.js 22 + npm。

```bash
git clone https://github.com/ChicaChan/rocom-egg-oracle.git
cd rocom-egg-oracle
npm ci
npm run data:update    # 抓取并构建 data/pets.json
npm run dev
```

访问 `http://127.0.0.1:3000`。

## 常用命令

```bash
npm run dev              # 本地开发（Turbopack）
npm run build            # 生产构建
npm run start            # 启动生产服务器
npm run lint             # tsc --noEmit 类型检查
npm run test             # vitest run（46 个用例）
npm run ci               # 完整 CI：data:validate + lint + test + build

npm run data:update      # 完整数据管道（extract → fetch-details → build → validate）
npm run data:fetch       # 仅抓 worker.js 元数据
npm run data:validate    # 仅跑 zod + IQR 离群校验
```

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。三种方式：

**Docker Compose**（推荐）：

```bash
docker compose up -d --build
curl http://127.0.0.1:3010/api/health
```

**原生 systemd**：

```bash
REPO_URL=https://github.com/ChicaChan/rocom-egg-oracle.git sudo -E bash scripts/linux-install.sh
```

**Nginx 反向代理**：模板在 `deploy/nginx/`。

## 项目结构

```text
app/                              Next.js App Router
├── layout.tsx                    ThemeProvider + Toaster
├── page.tsx                      Server Component 壳
├── globals.css                   Tailwind v4 + design tokens
└── api/{health,pet-image}        路由

components/
├── ui/                           shadcn/ui 原子组件
├── layout/                       SiteHeader / ThemeToggle / ThemeProvider
├── predictor/                    业务组件：PredictorShell / EggInputPanel / CandidateCard ...
└── decor/                        HeroDecor 等装饰层

lib/
├── predict/{filter,score,confidence,index}.ts   纯函数算法
├── data/{schema,pets}.ts                        zod schema + server-only loader
├── url/params.ts                                URL ↔ state
└── format/{number,pet}.ts                       展示工具

data/
├── pets.json                     主数据（zod 校验）
└── pets.meta.json                版本/来源/质量分布

scripts/data/                     数据管道（extract / fetch-details / build / validate）
test/                             vitest 单测 + fixtures
public/pets/                      预缓存精灵立绘（旧版残留，逐步替换）
deploy/                           systemd / Nginx 模板
```

## 贡献

欢迎提交 Issue 或 PR：

- **数据勘误**：使用「数据勘误」Issue 模板，附精灵名、当前数值、正确数值、依据
- **新增精灵**：等灵蛋所详情页扩展后，运行 `npm run data:update` 自动覆盖
- **算法优化**：算法在 `lib/predict/*`，配套 46 个 vitest 用例
- **UI 改进**：组件在 `components/predictor/*`，使用 shadcn/ui

提交前：

```bash
npm run ci
```

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 免责声明

本工具基于公开蛋孵化区间数据做启发式匹配，**不保证 100% 准确**。游戏版本更新、活动池调整、数据源变更都可能影响结果。

项目代码以 MIT License 发布。外部数据、游戏名称、精灵名称及相关素材归各自来源（[灵蛋所](https://luokewangguofudan.wiki)、[BWIKI](https://wiki.biligame.com/rocom/)、淘米科技、Tencent）和权利方所有。

## License

[MIT](./LICENSE)
