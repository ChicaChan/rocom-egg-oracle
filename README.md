# Rocom Egg Oracle

Rocom Egg Oracle 是一个面向《洛克王国：世界》玩家的精灵蛋预测工具。它通过玩家输入的精灵蛋尺寸和重量，在当前随机蛋池数据中反查可能孵出的精灵，并给出匹配排序和邻近参考。

这个项目的目标不是给出“绝对概率”，而是把公开孵蛋区间数据整理成一个更易用、可验证、可自行部署的开源工具。

## 项目特性

- 输入蛋尺寸和蛋重量，快速反查可能孵出的精灵。
- 严格命中模式：尺寸和重量必须同时落入候选精灵区间。
- 邻近参考模式：无严格命中时，展示数值最接近的参考候选。
- 使用 `R = weightKg / sizeM` 对命中候选排序，帮助缩小判断范围。
- 显示蛋重量分组：超轻蛋、轻蛋、中等蛋、重蛋、超重蛋。
- 支持孵化时间筛选和 Top N 结果数量控制。
- 默认只导入当前随机蛋池记录，避免把底层全量配置误当作可孵池。
- 可本地运行，也可通过 Docker、systemd、Nginx 部署到 Linux 服务器。

## 在线演示

暂未配置公开演示站点。部署完成后可以把地址补充在这里。

## 截图

暂未添加截图。建议后续补充首页输入区、严格命中结果、邻近参考结果 3 张截图。

## 数据来源

项目使用 RocomUID 公开孵蛋配置作为数据来源：

```text
https://raw.githubusercontent.com/jiluoQAQ/RocomUID/main/RocomUID/utils/map/breeding.json
```

注意：本项目默认只导入带 `random_eggs_group` 的当前随机蛋池记录，不会直接导入底层全量配置。

更新数据：

```bash
npm run data:update
```

## 匹配逻辑

严格命中必须同时满足：

```text
sizeMinM <= 输入尺寸 <= sizeMaxM
weightMinKg <= 输入重量 <= weightMaxKg
```

命中后，候选会按输入蛋的 `R` 值与候选区间中心 `R` 值的差距排序：

```text
R = weightKg / sizeM
```

邻近参考只表示数值接近，不代表一定可以孵出。

## 蛋重量分组

```text
0 - 1 kg       超轻蛋
1 - 1.8 kg     轻蛋
1.8 - 4 kg     中等蛋
4 - 14 kg      重蛋
14 kg 以上     超重蛋
```

如果候选精灵的重量区间跨越多个阈值，页面会显示多个覆盖分组。

## 技术栈

- Next.js
- React
- TypeScript
- Vitest
- Docker / Docker Compose

## 快速开始

要求：

- Node.js 22
- npm

```bash
git clone https://github.com/ChicaChan/rocom-egg-oracle.git
cd rocom-egg-oracle
npm ci
npm run data:update
npm run dev
```

访问：

```text
http://127.0.0.1:3000
```

## 常用命令

```bash
npm run dev          # 本地开发
npm run data:update  # 更新孵蛋数据
npm run lint         # TypeScript 类型检查
npm run test         # 单元测试
npm run build        # 生产构建
npm run ci           # 完整验证流程
```

## 部署

详细部署说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

Docker Compose 快速部署：

```bash
git clone https://github.com/ChicaChan/rocom-egg-oracle.git /opt/rocom-egg-oracle
cd /opt/rocom-egg-oracle
docker compose up -d --build
curl http://127.0.0.1:3000/api/health
```

原生 systemd 部署：

```bash
REPO_URL=https://github.com/ChicaChan/rocom-egg-oracle.git sudo -E bash scripts/linux-install.sh
```

## 项目结构

```text
app/                  Next.js 页面和 API
data/                 转换后的孵蛋数据
src/lib/              类型定义和预测算法
scripts/              数据更新与部署脚本
deploy/               systemd 和 Nginx 模板
test/                 单元测试
```

## 贡献

欢迎提交 Issue 或 Pull Request。

适合贡献的方向：

- 修正或补充孵蛋数据。
- 改进匹配排序算法。
- 增加截图、在线演示或使用文档。
- 优化移动端交互体验。
- 增加更多测试样例。

提交前请运行：

```bash
npm run ci
```

## 免责声明

本项目为玩家社区工具，结果仅供参考。活动池、游戏版本更新、数据源变更都可能影响实际孵化结果。

项目代码以 MIT License 发布。外部数据、游戏名称、精灵名称及相关素材归各自来源和权利方所有。

## License

[MIT](./LICENSE)
