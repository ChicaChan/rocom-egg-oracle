# 部署指南

本文档用于把项目部署到 Linux 服务器，或通过 Docker / Vercel 等方式上线。

> v2 数据语义已切换到「蛋孵化阶段区间」，主源为[灵蛋所](https://luokewangguofudan.wiki)。
> 旧的 BWIKI 抓取链路已弃用。更多见 [README.md](./README.md)。

## 1. GitHub 上传前检查

本项目已经包含：

- `.gitignore`：排除 `.next/`、`node_modules/`、缓存和环境变量文件。
- `.github/workflows/ci.yml`：GitHub Actions 自动执行数据更新、类型检查、测试和构建。
- `Dockerfile`、`docker-compose.yml`：容器化部署。
- `deploy/systemd/rocom-egg-predictor.service`：Linux systemd 原生服务模板。
- `deploy/nginx/rocom-egg-predictor.conf`：Nginx 反向代理模板。
- `scripts/linux-install.sh`：服务器一键安装/更新脚本。

上传步骤：

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

如果远程仓库已经存在并且非空，请先确认是否需要合并远程历史。

## 2. 推荐部署方式：Docker Compose

服务器要求：

- Linux x86_64
- Docker 与 Docker Compose Plugin
- 开放 `80/443`，或临时开放 `3000`

部署：

```bash
git clone https://github.com/<user>/<repo>.git /opt/rocom-egg-predictor
cd /opt/rocom-egg-predictor
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:3010/api/health
```

更新：

```bash
cd /opt/rocom-egg-predictor
git pull --ff-only
docker compose up -d --build
```

运行时已限制 Node 内存：

```text
NODE_OPTIONS=--max-old-space-size=256
```

## 3. 原生 systemd 部署

服务器要求：

- Node.js `22`
- npm
- git
- Nginx 可选

首次部署：

```bash
REPO_URL=https://github.com/<user>/<repo>.git sudo -E bash scripts/linux-install.sh
```

脚本默认安装到：

```text
/opt/rocom-egg-predictor
```

服务命令：

```bash
sudo systemctl status rocom-egg-predictor
sudo systemctl restart rocom-egg-predictor
sudo journalctl -u rocom-egg-predictor -f
```

## 4. Nginx 配置

复制模板：

```bash
sudo cp deploy/nginx/rocom-egg-predictor.conf /etc/nginx/sites-available/rocom-egg-predictor.conf
sudo ln -s /etc/nginx/sites-available/rocom-egg-predictor.conf /etc/nginx/sites-enabled/rocom-egg-predictor.conf
```

编辑域名：

```bash
sudo nano /etc/nginx/sites-available/rocom-egg-predictor.conf
```

把：

```nginx
server_name example.com;
```

替换为你的域名。

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

HTTPS 推荐使用 Certbot：

```bash
sudo certbot --nginx -d your-domain.com
```

## 5. 生产验证

部署后检查：

```bash
curl http://127.0.0.1:3000/api/health
curl http://your-domain.com/api/health
```

浏览器访问首页后，输入：

```text
尺寸：0.35
重量：7.45
```

应显示严格命中结果或邻近参考结果。

## 6. 数据更新

项目数据来自灵蛋所详情页和前端 worker.js 元数据。数据管道由 4 个步骤组成：

```bash
npm run data:update     # 完整管道：extract-luodan → fetch-details → build-pets → validate
npm run data:fetch      # 仅抓 worker.js 元数据
npm run data:validate   # 仅跑校验
```

CI 会每日凌晨 02:37 自动跑一次 `data:update`，如有变化提交到 main 分支。

手动更新部署后的数据：

```bash
npm run data:update
npm run build
sudo systemctl restart rocom-egg-predictor
```

Docker 部署的话直接：

```bash
docker compose up -d --build
```
