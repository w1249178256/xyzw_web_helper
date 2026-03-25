# 裸机部署（无 Docker）

将构建产物直接部署到目标服务器，由服务器上的 nginx 提供服务。

## 环境要求

| 环境 | 要求 |
|------|------|
| 本地 | Node.js 20+、pnpm 10.19.0、ssh、scp |
| 服务器 | Ubuntu 22（nginx 由脚本自动安装） |

## 快速开始

```sh
# 一键完成：构建 → 打包 → 上传 → 部署
sh deploy/bare/deploy.sh
```

## 分步执行

```sh
# 第一步：构建前端产物（生成 dist/）
sh deploy/bare/deploy.sh build

# 第二步：打包（生成 deploy/bare/xyzw_deploy.tar.gz）
sh deploy/bare/deploy.sh pack

# 第三步：上传到服务器
sh deploy/bare/deploy.sh upload

# 第四步：服务器上部署
sh deploy/bare/deploy.sh remote
```

## 部署内容

| 内容 | 服务器路径 |
|------|-----------|
| 静态文件（dist/） | `/var/www/xyzw/` |
| nginx 配置 | `/etc/nginx/sites-available/xyzw` |

## nginx 代理说明

`nginx.conf` 配置了以下反向代理：

| 路径 | 代理目标 | 用途 |
|------|---------|------|
| `/api/weixin/` | `https://open.weixin.qq.com/` | 微信登录 |
| `/api/weixin-long/` | `https://long.open.weixin.qq.com/` | 微信扫码轮询 |
| `/api/hortor/` | `https://comb-platform.hortorgames.com/` | Hortor 游戏登录 |

## 配置修改

编辑 `deploy/bare/deploy.sh` 顶部变量：

```sh
REMOTE_USER="root"          # 服务器用户名
REMOTE_HOST="47.120.18.209" # 服务器 IP
REMOTE_PORT="22"            # SSH 端口
```

## SSH 免密配置

首次部署前配置免密登录：

```sh
ssh-copy-id root@47.120.18.209
```

## 更新部署

每次代码更新后重新执行即可，脚本会覆盖旧文件并重启 nginx：

```sh
sh deploy/bare/deploy.sh
```
