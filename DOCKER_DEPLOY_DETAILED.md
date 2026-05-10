# 🐳 Docker 部署详细指南

## 📋 部署前提

### 硬件要求
- ✅ Android 设备已 **Root**
- ✅ 至少 **2GB** 可用内存
- ✅ 至少 **1GB** 可用存储空间
- ✅ Android 5.0 或更高版本

### 软件要求
- ✅ **Linux Deploy** 或其他 Android Linux 环境工具
- ✅ **Docker** 或兼容的容器运行时
- ✅ **网络连接**（用于下载镜像）

---

## 🚀 完整部署步骤

### 步骤 1：安装 Linux 环境

#### 方法 A：使用 Linux Deploy（推荐）

1. **下载 Linux Deploy**
   ```
   下载地址：https://github.com/meefik/linuxdeploy/releases
   或 Google Play 搜索 "Linux Deploy"
   ```

2. **配置 Linux Deploy**
   ```
   打开 Linux Deploy
   → 点击右下角设置图标
   → 配置以下选项：
   
   发行版：Debian 11 (bullseye)
   架构：arm64 (或根据你的设备)
   安装类型：目录
   安装路径：/data/local/linux
   映像大小：2000 MB
   用户：root
   密码：changeme
   ```

3. **安装系统**
   ```
   点击右下角三个点 → 安装
   等待安装完成（约 10-20 分钟）
   ```

4. **启动系统**
   ```
   点击播放按钮启动 Linux
   使用 SSH 客户端连接：
   地址：localhost
   端口：22
   用户：root
   密码：changeme
   ```

#### 方法 B：使用 Termux + Proot

```bash
# 在 Termux 中安装 Ubuntu
pkg update && pkg upgrade
pkg install proot-distro
proot-distro install ubuntu
proot-distro login ubuntu
```

---

### 步骤 2：安装 Docker

#### 在 Debian/Ubuntu 中安装 Docker

```bash
# 1. 更新软件包索引
apt update && apt upgrade -y

# 2. 安装必要的依赖
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 3. 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 4. 设置 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. 安装 Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# 6. 验证 Docker 安装
docker --version
docker run hello-world
```

#### 如果官方 Docker 无法安装（ARM 架构问题）

```bash
# 使用 Docker 的替代方案 - Podman
apt install -y podman

# 验证安装
podman --version
podman run hello-world
```

---

### 步骤 3：传输部署文件

#### 方法 A：使用 SCP 从电脑传输

```bash
# 在电脑上执行
scp XYZW_Web_Helper_Android_Deploy.zip root@手机IP:/root/

# 在 Linux 环境中解压
unzip XYZW_Web_Helper_Android_Deploy.zip
cd android-deploy
```

#### 方法 B：直接在 Linux 环境中下载

```bash
# 如果文件在 GitHub 上
wget https://github.com/your-repo/xyzw_web_helper/releases/download/v2.0.0/XYZW_Web_Helper_Android_Deploy.zip
unzip XYZW_Web_Helper_Android_Deploy.zip
cd android-deploy
```

#### 方法 C：从手机存储复制

```bash
# 挂载手机存储（如果使用 Linux Deploy）
mount -t sdcardfs /sdcard /mnt/sdcard

# 复制文件
cp /mnt/sdcard/Download/XYZW_Web_Helper_Android_Deploy.zip ~/
unzip XYZW_Web_Helper_Android_Deploy.zip
cd android-deploy
```

---

### 步骤 4：构建 Docker 镜像

```bash
# 1. 进入部署目录
cd ~/android-deploy

# 2. 查看文件结构
ls -la
# 应该看到：dist/, dockerfile, nginx.conf, README.md

# 3. 构建 Docker 镜像
docker build -t xyzw-web-helper .

# 等待构建完成（约 2-5 分钟）
# 看到 "Successfully tagged xyzw-web-helper" 表示成功
```

#### 如果使用 Podman

```bash
podman build -t xyzw-web-helper .
```

---

### 步骤 5：运行 Docker 容器

#### 基础运行命令

```bash
# 运行容器
docker run -d \
  --name xyzw-helper \
  -p 8080:80 \
  --restart unless-stopped \
  xyzw-web-helper
```

#### 参数说明

```bash
-d                    # 后台运行容器
--name xyzw-helper    # 容器名称
-p 8080:80           # 端口映射（主机 8080 → 容器 80）
--restart unless-stopped  # 自动重启策略
```

#### 高级运行配置

```bash
# 带资源限制的完整配置
docker run -d \
  --name xyzw-helper \
  -p 8080:80 \
  --restart unless-stopped \
  --memory="256m" \
  --cpus="0.5" \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  xyzw-web-helper
```

#### 如果使用 Podman

```bash
podman run -d \
  --name xyzw-helper \
  -p 8080:80 \
  --restart=unless-stopped \
  xyzw-web-helper
```

---

### 步骤 6：访问应用

#### 本地访问

```
打开浏览器访问：
http://localhost:8080
```

#### 局域网访问

```bash
# 1. 查看 Linux 环境的 IP 地址
ifconfig
# 或
ip addr show

# 2. 在其他设备浏览器访问
http://[Linux 环境IP]:8080

# 例如：http://192.168.1.100:8080
```

#### 从手机宿主机访问

```
如果 Linux 环境在容器中：
http://localhost:8080

如果需要配置网络桥接：
http://[容器IP]:8080
```

---

## 🔧 Docker 管理命令

### 容器管理

```bash
# 查看运行状态
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 查看容器日志
docker logs xyzw-helper

# 实时查看日志
docker logs -f xyzw-helper

# 停止容器
docker stop xyzw-helper

# 启动容器
docker start xyzw-helper

# 重启容器
docker restart xyzw-helper

# 删除容器
docker rm xyzw-helper
```

### 镜像管理

```bash
# 查看镜像
docker images

# 删除镜像
docker rmi xyzw-web-helper

# 导出镜像
docker save -o xyzw-web-helper.tar xyzw-web-helper

# 导入镜像
docker load -i xyzw-web-helper.tar
```

### 进入容器

```bash
# 进入容器内部
docker exec -it xyzw-helper /bin/bash

# 查看容器配置
docker inspect xyzw-helper
```

---

## 🔍 故障排查

### 问题 1：Docker 无法启动

```bash
# 检查 Docker 服务状态
systemctl status docker

# 启动 Docker 服务
systemctl start docker

# 设置开机自启
systemctl enable docker
```

### 问题 2：端口被占用

```bash
# 查看端口占用
netstat -tulpn | grep :8080

# 解决方案 1：修改容器端口
docker run -d -p 9090:80 --name xyzw-helper xyzw-web-helper

# 解决方案 2：停止占用端口的服务
kill [PID]
```

### 问题 3：容器无法启动

```bash
# 查看容器日志
docker logs xyzw-helper

# 查看容器详细信息
docker inspect xyzw-helper

# 尝试重新构建镜像
docker build -t xyzw-web-helper . --no-cache
```

### 问题 4：网络无法访问

```bash
# 检查防火墙
iptables -L -n

# 开放端口
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# 检查网络配置
docker network ls
docker network inspect bridge
```

### 问题 5：存储空间不足

```bash
# 查看 Docker 占用空间
docker system df

# 清理未使用的资源
docker system prune -a

# 清理构建缓存
docker builder prune
```

---

## 📊 性能优化

### 资源限制

```bash
# 限制内存和 CPU
docker run -d \
  --name xyzw-helper \
  -p 8080:80 \
  --memory="256m" \
  --cpus="0.5" \
  --memory-swap="512m" \
  xyzw-web-helper
```

### 日志轮转

```bash
# 配置日志大小限制
docker run -d \
  --name xyzw-helper \
  -p 8080:80 \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  xyzw-web-helper
```

### 持久化存储

```bash
# 挂载数据卷（如果需要持久化）
docker run -d \
  --name xyzw-helper \
  -p 8080:80 \
  -v /data/xyzw:/app/web \
  xyzw-web-helper
```

---

## 🔒 安全配置

### 1. 创建非 root 用户

```dockerfile
# 修改 dockerfile
FROM nginx:xyzw

# 创建非 root 用户
RUN adduser --disabled-password --gecos '' appuser

VOLUME /app/web
COPY ./dist /app/web

VOLUME /etc/nginx/conf.d
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# 更改文件所有者
RUN chown -R appuser:appuser /app/web

USER appuser

WORKDIR /app

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. 配置防火墙

```bash
# 只允许特定 IP 访问
iptables -A INPUT -p tcp --dport 8080 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 8080 -j DROP
```

### 3. 使用只读文件系统

```bash
docker run -d \
  --name xyzw-helper \
  -p 8080:80 \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/cache/nginx \
  --tmpfs /var/run \
  xyzw-web-helper
```

---

## 📈 监控和日志

### 查看资源使用

```bash
# 实时查看容器资源使用
docker stats xyzw-helper

# 查看容器详细信息
docker inspect xyzw-helper

# 查看容器进程
docker top xyzw-helper
```

### 日志管理

```bash
# 查看最近 100 行日志
docker logs --tail 100 xyzw-helper

# 查看特定时间的日志
docker logs --since 2026-04-11T10:00:00 xyzw-helper

# 导出日志
docker logs xyzw-helper > xyzw-helper.log
```

---

## 🔄 更新和升级

### 更新应用

```bash
# 1. 停止旧容器
docker stop xyzw-helper
docker rm xyzw-helper

# 2. 重新构建镜像
cd ~/android-deploy
docker build -t xyzw-web-helper .

# 3. 启动新容器
docker run -d \
  --name xyzw-helper \
  -p 8080:80 \
  --restart unless-stopped \
  xyzw-web-helper
```

### 清理旧镜像

```bash
# 删除旧镜像
docker rmi $(docker images | grep xyzw-web-helper | grep none | awk '{print $3}')
```

---

## 🎯 开机自启动

### 配置 systemd 服务

```bash
# 创建服务文件
cat > /etc/systemd/system/xyzw-helper.service << EOF
[Unit]
Description=XYZW Web Helper Docker Container
After=docker.service
Requires=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker start -a xyzw-helper
ExecStop=/usr/bin/docker stop -t 2 xyzw-helper

[Install]
WantedBy=multi-user.target
EOF

# 重载 systemd
systemctl daemon-reload

# 启用服务
systemctl enable xyzw-helper

# 启动服务
systemctl start xyzw-helper
```

---

## 📞 常见问题 FAQ

### Q1: ARM 架构无法运行 Docker？
**A**: 使用 Podman 替代
```bash
apt install -y podman
podman run -d -p 8080:80 --name xyzw-helper xyzw-web-helper
```

### Q2: 如何备份容器数据？
**A**: 导出镜像和容器
```bash
# 导出镜像
docker save -o xyzw-backup.tar xyzw-web-helper

# 导出容器配置
docker inspect xyzw-helper > xyzw-inspect.json
```

### Q3: 如何配置 HTTPS？
**A**: 使用 Nginx 反向代理
```bash
# 修改 nginx.conf，添加 SSL 配置
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    # ... 其他配置
}
```

### Q4: 容器运行缓慢？
**A**: 优化资源配置
```bash
# 调整资源限制
docker update \
  --memory="512m" \
  --cpus="1.0" \
  xyzw-helper
```

### Q5: 如何查看容器 IP？
**A**: 使用 inspect 命令
```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' xyzw-helper
```

---

## 🎉 部署完成检查清单

- [ ] Docker/Podman 已安装并运行
- [ ] 镜像构建成功
- [ ] 容器正常运行
- [ ] 可以通过 localhost:8080 访问
- [ ] 可以通过局域网访问
- [ ] 容器已配置自动重启
- [ ] 日志配置正常
- [ ] 资源限制已设置（可选）
- [ ] 防火墙已配置（可选）

---

## 📖 相关资源

- **Docker 官方文档**: https://docs.docker.com/
- **Podman 官方文档**: https://podman.io/
- **Linux Deploy 教程**: https://github.com/meefik/linuxdeploy
- **Nginx 配置指南**: https://nginx.org/en/docs/

---

**最后更新**: 2026-04-11  
**适用版本**: XYZW Web Helper 2.0.0
