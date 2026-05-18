## 改动摘要

<!-- 一句话说明这个 PR 做了什么，以及为什么需要 -->

## 关联 Issue

<!-- Fixes #123 / Refs #456 -->

## 改动类型

- [ ] feat — 新功能
- [ ] fix — Bug 修复
- [ ] refactor — 重构
- [ ] perf — 性能优化
- [ ] data — 数据勘误 / 数据管道改动
- [ ] docs — 文档更新
- [ ] ci/chore — 工程化

## 测试方式

<!-- 怎么验证这次改动？例如：
- 访问 /?size=0.28&weight=2.36，第 1 名应该是迪莫
- 运行 npm run test 全绿
- 改了数据：附 scripts/reports/validate-report.md diff
-->

## Breaking Changes

- [ ] 无
- [ ] 有：<!-- 详细说明影响的 API / 数据 schema / URL 参数 -->

## 检查清单

- [ ] `npm run ci` 通过（data:validate + lint + test + build）
- [ ] 改了算法层时同步更新了 `test/unit/predict/*.test.ts`
- [ ] 改了数据 schema 时同步更新了 `lib/data/schema.ts` + 相关 fixture
- [ ] UI 改动在桌面 + 移动端 + 暗色模式都验证过
- [ ] 没有引入新的运行时依赖（如果有，body 说明理由）
