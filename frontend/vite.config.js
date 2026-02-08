import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // 🟢 新增 server 配置
  server: {
    host: '0.0.0.0', // 允许局域网访问（可选）
    port: 5173,      // 前端端口
    
    // 关键：配置代理，解决本地开发时的 404 问题
    proxy: {
      '/api': {
        // 后端地址：确保和你 main.py 运行的端口一致 (推荐 7860)
        target: 'http://127.0.0.1:7860', 
        changeOrigin: true,
        secure: false,
        // 如果你的后端路由是 @app.post("/api/analyze")，则不需要 rewrite
        // 如果你的后端路由是 @app.post("/analyze")，则需要解开下面的注释：
        // rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },

  // 🔵 构建配置 (Hugging Face 部署会用到)
  build: {
    outDir: 'dist', // 默认就是 dist，写出来明确一点
    assetsDir: 'assets',
    emptyOutDir: true,
  }
})