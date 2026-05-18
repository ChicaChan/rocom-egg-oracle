# 贡献指南

感谢你愿意为 Rocom Egg Oracle 出力喵 (´｡• ᵕ •｡`) ♡

## 一、提交 Issue

### 数据勘误（最常见、最有价值）

如果发现某只精灵的尺寸/重量区间与游戏实际不符，请提交 [数据勘误 Issue](../../issues/new?template=data-correction.md)，包含：

- 精灵名（含形态后缀，如「鸭吉吉·紧实的样子」）
- 当前 pets.json 显示的区间
- 你认为正确的区间
- 依据：游戏截图 / 灵蛋所详情页 URL / 官方公告链接

### Bug 报告

[Bug 报告 Issue](../../issues/new?template=bug-report.md) 模板需要：

- 操作步骤
- 期望结果 vs 实际结果
- 浏览器 + 系统版本
- 控制台截图（如有报错）

## 二、提交 Pull Request

### 准备

```bash
git clone https://github.com/ChicaChan/rocom-egg-oracle.git
cd rocom-egg-oracle
npm ci
npm run data:update
```

### 开发约定

- **TypeScript 严格模式**：`tsc --noEmit` 必须通过
- **算法层纯函数**：`lib/predict/*` 严禁副作用，所有依赖通过参数传入
- **数据 schema 单一真相源**：所有 Pet 类型从 `lib/data/schema.ts` 推导，不要在组件里重新定义
- **Server-only 加载器**：`lib/data/pets.ts` 受 `import "server-only"` 保护，client component 不能直接 import pets.json
- **shadcn/ui 风格**：新增 UI 组件参考 `components/ui/*`，cva variants + cn utility
- **Motion 友好**：所有动画必须 `motion-safe:` 限定，hover 位移加 `motion-reduce:transform-none`

### 提交规范

[Conventional Commits](https://www.conventionalcommits.org/) 风格：

```text
<type>(<scope>): <subject>

<body 第 1 段：what & why>

<body 第 2 段：how（可选）>
```

常用 type：`feat`、`fix`、`refactor`、`chore`、`docs`、`test`、`perf`、`ci`。

scope 用项目子系统：`predict` / `data` / `ui` / `scaffold` / `deploy`。

### 验证

提交前必须全绿：

```bash
npm run ci    # = data:validate + lint + test + build
```

如果改了算法层，请同步更新 `test/unit/predict/*.test.ts` 并保证覆盖率不下降。

### Pull Request 模板

PR 描述请用 [.github/pull_request_template.md](./.github/pull_request_template.md) 模板，包含：

- 改动摘要
- 关联 Issue
- 测试方式（如何手动复现修复 / 新功能）
- Breaking changes（如果有）

## 三、数据管道工作流

```text
extract-luodan         # worker.js → 358 条元数据
        ↓
fetch-luodan-details   # 5 个详情页 → ≈31 条 verified 蛋区间
        ↓
build-pets             # 合成 pets.json，dataQuality=verified
        ↓
validate               # zod + 离群检查 + 报告
```

每一步都有独立 npm script（`data:fetch` / `data:enrich` / `data:validate`）便于调试。`scripts/.cache/luodan/` 是抓取缓存（gitignored），删除即可强制重抓。

## 四、行为准则

请保持友善和尊重。数据贡献者、代码贡献者、玩家社区的反馈同样重要喵～

## License

提交即表示你同意以 [MIT License](./LICENSE) 发布你的贡献。
