# 使用本地预构建的 node 镜像，避免从 Docker Hub 拉取（网络限制）
# 如需重建基础镜像: sh docker/install.sh deps
FROM xyzw-deps:latest

WORKDIR /app

# 切换到阿里云 Alpine 镜像源，加速国内下载
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# sql.js is pure JS/WASM — no native compilation needed
COPY package.json ./
RUN pnpm install --prod --registry=https://registry.npmmirror.com

COPY . .

RUN mkdir -p data

VOLUME /app/data

EXPOSE 3001

CMD ["node", "server.js"]
