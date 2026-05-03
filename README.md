# 洛克王国世界孵蛋预测工具

一个用于“洛克王国：世界”精灵蛋反查的 Web 工具。输入精灵蛋尺寸 `m` 和重量 `kg` 后，工具会在当前随机蛋池数据中严格匹配候选精灵，并按 `R = weightKg / sizeM` 的接近程度排序。

## 功能

- 输入蛋尺寸和蛋重量，预测可能孵出的精灵。
- 严格命中：尺寸与重量必须同时落入候选精灵区间。
- 邻近参考：无严格命中时展示数值最接近的参考候选，并明确标记为参考。
- 显示蛋重量分组：超轻蛋、轻蛋、中等蛋、重蛋、超重蛋。
- 支持孵化时间筛选和 Top N 结果数量控制。
- 使用 `useDeferredValue`、`useMemo`、渲染隔离和静态数据，降低输入卡顿与内存占用。
- 提供 Docker Compose、systemd、Nginx 部署模板。

## 数据来源

项目默认使用 RocomUID 公开孵蛋配置，并只导入带 `random_eggs_group` 的当前随机蛋池记录。不要把底层全量配置直接当作当前可孵精灵池。

数据源：

```text
https://raw.githubusercontent.com/jiluoQAQ/RocomUID/main/RocomUID/utils/map/breeding.json
```

更新数据：

```bash
npm run data:update
```

## 算法

严格结果必须同时满足：

```text
sizeMinM <= 输入尺寸 <= sizeMaxM
weightMinKg <= 输入重量 <= weightMaxKg
```

命中后按 `R = weightKg / sizeM` 与候选区间中心 R 值的差距排序。邻近参考只表示数值接近，不代表可孵出。

蛋重量分组：

```text
0 - 1 kg       超轻蛋
1 - 1.8 kg     轻蛋
1.8 - 4 kg     中等蛋
4 - 14 kg      重蛋
14 kg 以上     超重蛋
```

候选精灵如果重量区间跨越多个阈值，会显示多个覆盖分组。

## 本地开发

要求：

- Node.js `22`
- npm

安装与启动：

```bash
npm ci
npm run data:update
npm run dev
```

访问：

```text
http://127.0.0.1:3000
```

质量检查：

```bash
npm run lint
npm run test
npm run build
```

完整 CI 流程：

```bash
npm run ci
```

## GitHub 上传

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

项目已包含 GitHub Actions：

```text
.github/workflows/ci.yml
```

每次推送到 `main` 或 PR 到 `main` 会自动执行数据更新、类型检查、测试和构建。

## Linux 部署

详细步骤见：

```text
DEPLOYMENT.md
```

推荐 Docker Compose：

```bash
git clone https://github.com/<user>/<repo>.git /opt/rocom-egg-predictor
cd /opt/rocom-egg-predictor
docker compose up -d --build
curl http://127.0.0.1:3000/api/health
```

原生 systemd：

```bash
REPO_URL=https://github.com/<user>/<repo>.git sudo -E bash scripts/linux-install.sh
```

## 生产配置

`.env.example`：

```text
HOSTNAME=0.0.0.0
PORT=3000
NODE_ENV=production
```

Docker 和 systemd 默认设置：

```text
NODE_OPTIONS=--max-old-space-size=256
NEXT_TELEMETRY_DISABLED=1
```

## 健康检查

```bash
curl http://127.0.0.1:3000/api/health
```

返回：

```json
{
  "ok": true,
  "service": "rocom-egg-predictor"
}
```

## 说明

结果仅供参考。活动池、游戏版本更新或数据源变更都可能影响实际结果。

代码以 MIT License 发布；外部数据与游戏相关内容归各自来源和权利方所有。
