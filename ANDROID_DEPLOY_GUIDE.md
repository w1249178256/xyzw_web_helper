# 📱 XYZW Web Helper Android 快速部署指南

## ✅ 打包完成

**文件名称**: `XYZW_Web_Helper_Android_Deploy.zip`  
**文件大小**: ~7.3 MB  
**构建时间**: 2026-04-11  
**包含内容**:
- ✅ 构建完成的 dist 静态文件
- ✅ Nginx 配置文件
- ✅ Docker 配置文件
- ✅ Linux/Mac 安装脚本
- ✅ Windows 安装脚本
- ✅ 详细部署说明文档

---

## 📥 部署方式总览

### 🚀 方式一：Termux + Nginx（推荐⭐⭐⭐⭐⭐）
**适用场景**: 无 Root 权限，稳定运行  
**难度**: ⭐⭐⭐  
**性能**: ⭐⭐⭐⭐⭐

#### 步骤：
1. 安装 Termux（从 F-Droid）
2. 将 zip 文件传输到手机
3. 解压文件
4. 运行安装脚本
5. 访问 localhost:80

---

### 🐳 方式二：Docker 部署
**适用场景**: 有 Root 权限，需要容器化  
**难度**: ⭐⭐⭐⭐  
**性能**: ⭐⭐⭐⭐⭐

#### 步骤：
1. 在 Android Linux 环境中安装 Docker
2. 解压部署包
3. 构建 Docker 镜像
4. 运行容器

---

### 🌐 方式三：KSWEB 服务器
**适用场景**: 最简单，图形界面  
**难度**: ⭐  
**性能**: ⭐⭐⭐⭐

#### 步骤：
1. 安装 KSWEB（Google Play）
2. 解压 dist 文件夹
3. 在 KSWEB 中选择 dist 目录
4. 启动服务器

---

### 📂 方式四：Acode 浏览器预览
**适用场景**: 开发测试  
**难度**: ⭐  
**性能**: ⭐⭐⭐

#### 步骤：
1. 安装 Acode（Google Play）
2. 解压 dist 文件夹
3. 用 Acode 打开 index.html
4. 使用内置浏览器预览

---

## 🎯 详细部署步骤（Termux 方式）

### 1️⃣ 安装 Termux
```
推荐从 F-Droid 下载：
https://f-droid.org/packages/com.termux/

不要从 Google Play 下载（版本过旧）
```

### 2️⃣ 传输文件到手机
```bash
# 方法 1: USB 传输
# 将 zip 文件复制到手机内部存储

# 方法 2: 使用 Termux:API
pkg install termux-api
termux-download  # 下载文件

# 方法 3: scp 传输（从电脑）
scp XYZW_Web_Helper_Android_Deploy.zip termux@localhost:~/
```

### 3️⃣ 解压部署包
```bash
# 在 Termux 中
cd ~
unzip XYZW_Web_Helper_Android_Deploy.zip
cd android-deploy
```

### 4️⃣ 执行安装脚本
```bash
# 给脚本添加执行权限
chmod +x install.sh

# 运行安装脚本
./install.sh
```

### 5️⃣ 访问应用
```
打开浏览器访问：
http://localhost:80

或局域网访问：
http://[你的手机IP]:80
```

---

## 🔧 常见问题

### Q1: Termux 无法下载应用？
**A**: 从 F-Droid 下载，不要从 Google Play

### Q2: 解压失败？
**A**: 安装 unzip 工具
```bash
pkg install unzip
```

### Q3: Nginx 无法启动？
**A**: 检查端口占用
```bash
netstat -tulpn | grep :80
# 如果端口被占用，修改 nginx.conf 中的 listen 端口
```

### Q4: 如何后台运行？
**A**: 使用 termux-wake-lock
```bash
termux-wake-lock
```

### Q5: 如何开机自启动？
**A**: 使用 Tasker 或 Automate 等自动化应用

---

## 📊 性能对比

| 部署方式 | 启动速度 | 运行性能 | 稳定性 | 推荐度 |
|---------|---------|---------|--------|--------|
| Termux + Nginx | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Docker | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| KSWEB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Acode | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

---

## 🎉 部署成功！

部署完成后，你可以：
- ✅ 通过浏览器访问应用
- ✅ 在局域网内共享服务
- ✅ 配置域名和 HTTPS
- ✅ 使用 Cloudflare Tunnel 进行内网穿透

---

## 📞 需要帮助？

查看详细文档：`android-deploy/README.md`

**项目主页**: https://github.com/your-repo/xyzw_web_helper
