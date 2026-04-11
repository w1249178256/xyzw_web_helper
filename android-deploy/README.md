# XYZW Web Helper Android 部署包

## 📦 部署包内容

```
android-deploy/
├── dist/                  # 构建后的静态文件
│   ├── index.html        # 主页面
│   ├── assets/           # JS/CSS 资源
│   └── _worker.js        # Cloudflare Worker 脚本
├── nginx.conf            # Nginx 配置文件
├── dockerfile            # Docker 配置文件
├── install.sh            # Linux/Mac 安装脚本
├── install.cmd           # Windows 安装脚本
└── README.md             # 本说明文档
```

## 📱 Android 部署方式

### 方式一：使用 Termux（推荐）

#### 1. 安装 Termux
- 从 F-Droid 下载 Termux：https://f-droid.org/packages/com.termux/
- 或在 GitHub 下载：https://github.com/termux/termux-app/releases

#### 2. 更新包并安装必要工具
```bash
pkg update && pkg upgrade
pkg install nginx
pkg install python
```

#### 3. 部署文件
```bash
# 创建部署目录
mkdir -p ~/xyzw_web_helper
cd ~/xyzw_web_helper

# 将部署包复制到 Termux
# 方法 1: 使用共享存储
cp /sdcard/Download/android-deploy/* ~/xyzw_web_helper/ -r

# 方法 2: 使用 scp（从电脑传输）
# scp -r android-deploy/* termux@localhost:~/xyzw_web_helper/
```

#### 4. 配置 Nginx
```bash
# 创建 Nginx 配置目录
mkdir -p ~/.nginx

# 复制配置文件
cp nginx.conf ~/.nginx/nginx.conf

# 修改 Nginx 配置（如果需要）
# 编辑 ~/.nginx/nginx.conf，确保 root 指向正确的 dist 路径
```

#### 5. 启动服务
```bash
# 方式 1: 使用 Nginx
nginx -c ~/.nginx/nginx.conf

# 方式 2: 使用 Python 简单 HTTP 服务器（临时测试）
cd dist
python -m http.server 8080
```

#### 6. 访问应用
打开浏览器访问：`http://localhost:8080` 或 `http://127.0.0.1:8080`

---

### 方式二：使用 Docker（需要 Root）

#### 1. 安装 Docker
```bash
# 在 Android 上安装 Docker（需要 Root 权限）
# 推荐使用 Linux Deploy 或其他 Android Linux 环境工具
```

#### 2. 构建镜像
```bash
cd android-deploy
docker build -t xyzw-web-helper .
```

#### 3. 运行容器
```bash
docker run -d -p 8080:80 --name xyzw-helper xyzw-web-helper
```

#### 4. 访问应用
打开浏览器访问：`http://localhost:8080`

---

### 方式三：使用 KSWEB（最简单）

#### 1. 安装 KSWEB
- 从 Google Play 下载：https://play.google.com/store/apps/details?id=ru.kslabs.ksweb

#### 2. 配置 KSWEB
1. 打开 KSWEB
2. 点击 "..." 按钮选择项目目录
3. 选择 `android-deploy/dist` 目录
4. 启动 Nginx 服务器

#### 3. 访问应用
打开浏览器访问：`http://localhost:8080`

---

### 方式四：使用 Acode + 浏览器（开发模式）

#### 1. 安装 Acode
- 从 Google Play 下载：https://play.google.com/store/apps/details?id=com.foxdebug.acodefree

#### 2. 部署文件
1. 将 `dist` 文件夹复制到手机存储
2. 使用 Acode 打开 `dist/index.html`
3. 使用内置浏览器预览

---

## 🔧 配置说明

### Nginx 配置
```nginx
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /path/to/dist;  # 修改为实际的 dist 路径
        try_files $uri $uri/ /index.html;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /path/to/dist;
    }
}
```

### 端口配置
- 默认端口：`80` 或 `8080`
- 修改端口：编辑 `nginx.conf` 文件中的 `listen` 指令

---

## 🚀 快速启动脚本

### Linux/Mac
```bash
chmod +x install.sh
./install.sh
```

### Windows
```cmd
install.cmd
```

---

## 📝 注意事项

1. **存储权限**：确保应用有访问存储的权限
2. **网络权限**：如果需要远程访问，确保防火墙允许相应端口
3. **后台运行**：使用 Termux 时，可以使用 `termux-wake-lock` 保持后台运行
4. **自动启动**：可以配置系统服务实现开机自启动

---

## 🔍 故障排查

### 问题 1: Nginx 无法启动
```bash
# 检查配置文件
nginx -t

# 查看错误日志
cat /var/log/nginx/error.log
```

### 问题 2: 端口被占用
```bash
# 查看端口占用
netstat -tulpn | grep :80

# 修改端口
# 编辑 nginx.conf，将 listen 80 改为 listen 8080
```

### 问题 3: 文件权限问题
```bash
# 修改文件权限
chmod -R 755 ~/xyzw_web_helper/dist
```

---

## 📞 支持

如有问题，请查看项目文档或联系开发者。

**项目地址**: [GitHub](https://github.com/your-repo/xyzw_web_helper)
