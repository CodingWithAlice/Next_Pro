# 使用 Node.js 官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 到工作目录
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目所有文件到工作目录
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 暴露应用端口，Next.js 默认端口是 3000
EXPOSE 3000

# 启动 Next.js 应用
CMD ["npm", "start"]