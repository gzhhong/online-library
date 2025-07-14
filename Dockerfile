# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm cache clean --force && npm install

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 运行阶段
FROM node:18-alpine AS runner

# 创建app用户/组
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs --ingroup nodejs

WORKDIR /app

# 创建所有必要的目录并设置权限
RUN mkdir -p uploads public && \
    mkdir -p /tmp/npm && \
    chmod -R 777 /tmp/npm && \
    chown -R nextjs:nodejs /app && \
    chown -R nextjs:nodejs /home/nextjs && \
    chown -R nextjs:nodejs /tmp/npm

# 设置环境变量
ENV NODE_ENV=production
ENV npm_config_cache=/tmp/npm

# 从构建阶段复制必要文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/prisma ./prisma

# 修改所有文件的所有者
RUN chown -R nextjs:nodejs .

# 切换到非root用户
USER nextjs

# 只安装生产依赖
RUN npm install --omit=dev --force

# 生成Prisma客户端
RUN npx prisma generate

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["sh", "-c", "npm start"]