# Docker 部署

将本地构建好的 Docker 镜像导出、上传并在目标服务器上运行。

## 环境要求

| 环境 | 要求 |
|------|------|
| 本地 | Docker、ssh、scp |
| 服务器 | Ubuntu 22（Docker 由脚本自动安装） |

## 完整流程

### 第一次部署

```sh
# 步骤 1：构建依赖镜像（仅首次或依赖变更时执行）
sh docker/install.sh deps

# 步骤 2：构建应用镜像
sh docker/install.sh build

# 步骤 3：导出 + 上传 + 部署到服务器
sh deploy/docker/deploy.sh
```

### 后续更新

```sh
# 重新构建应用镜像（deps 镜像无需重建）
sh docker/install.sh build

# 重新部署
sh deploy/docker/deploy.sh
```

## 分步执行

```sh
# 仅导出镜像（生成 deploy/docker/xyzw_web_helper.docker）
sh deploy/docker/deploy.sh save

# 仅上传镜像到服务器
sh deploy/docker/deploy.sh upload

# 仅在服务器上加载并启动容器
sh deploy/docker/deploy.sh remote
```

## 容器信息

| 项目 | 值 |
|------|---|
| 镜像名 | `xyzw_web_helper:latest` |
| 容器名 | `my_xyzw_web_helper` |
| 服务端口 | `8080`（映射容器内 80） |
| 重启策略 | `unless-stopped` |

## 配置修改

编辑 `deploy/docker/deploy.sh` 顶部变量：

```sh
REMOTE_USER="root"          # 服务器用户名
REMOTE_HOST="47.120.18.209" # 服务器 IP
REMOTE_PORT="22"            # SSH 端口
HOST_PORT="8080"            # 服务器对外端口
```

## SSH 免密配置

首次部署前配置免密登录：

```sh
ssh-copy-id root@47.120.18.209
```

## 容器管理

```sh
# 查看运行状态
ssh root@47.120.18.209 "docker ps | grep xyzw"

# 查看日志
ssh root@47.120.18.209 "docker logs my_xyzw_web_helper"

# 停止容器
ssh root@47.120.18.209 "docker rm -f my_xyzw_web_helper"
```

## 与裸机部署的对比

| 对比项 | Docker 部署 | 裸机部署 |
|--------|------------|---------|
| 服务器依赖 | 仅需 Docker | 需要 Node 构建环境 |
| 镜像包大小 | 较大（含完整运行时） | 较小（仅 dist + nginx 配置） |
| 隔离性 | 好 | 无 |
| 更新速度 | 需重新导出上传 | 仅传 dist 文件 |
