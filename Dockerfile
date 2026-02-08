# ==================================
# 1. 前端构建阶段 (Node.js)
# ==================================
FROM node:18 AS frontend-builder

# 设置工作目录
WORKDIR /app/frontend

# 先复制 package.json 安装依赖 (利用 Docker 缓存加速)
COPY frontend/package*.json ./
RUN npm install

# 复制前端所有代码
COPY frontend/ ./

# 执行构建 -> 生成 dist 文件夹
RUN npm run build


# ==================================
# 2. 后端运行阶段 (Python)
# ==================================
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖 (ffmpeg 是音频处理必须的)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# 复制后端依赖清单
COPY backend/requirements.txt .

# 安装 Python 库 (增加清华源加速可选，这里用官方源)
RUN pip install --no-cache-dir -r requirements.txt

# 创建静态文件目录 (用于存放前端构建产物)
RUN mkdir -p /app/static

# 复制后端代码
COPY backend/ .

# 【关键步骤】把第一阶段构建好的前端文件 (dist) 复制到后端的 static 目录
COPY --from=frontend-builder /app/frontend/dist /app/static

# 创建临时文件夹 (用于上传文件处理)
RUN mkdir -p /app/temp && chmod 777 /app/temp

# 设置 Hugging Face 要求的端口
ENV PORT=7860

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]