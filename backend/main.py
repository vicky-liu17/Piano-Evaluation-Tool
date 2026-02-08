import os
import io
import traceback
import tempfile
import numpy as np
import librosa
import uvicorn

from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

# 导入你的算法模块 (确保这些文件也在 backend 目录下)
from audio_utils import process_audio_data, extract_chroma_data, calculate_rhythm_segments
from dtw_utils import compute_dtw

app = FastAPI()

# --- CORS 配置 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. API 接口定义 (必须放在静态文件挂载之前)
# ==========================================

# --- 辅助函数 ---
async def load_audio(file: UploadFile):
    try:
        content = await file.read()
        y, sr = librosa.load(io.BytesIO(content), sr=22050, mono=True)
        return y, sr
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading audio file: {str(e)}")

# --- API 1: 单文件分析 ---
@app.post("/api/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    print(f"👉 [Analyze] 正在处理文件: {file.filename}")
    tmp_file_path = ""

    try:
        content = await file.read()
        # 创建临时文件 (兼容 Windows/Linux)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(content)
            tmp_file_path = tmp.name
        
        # 使用 librosa 加载临时文件
        y, sr = librosa.load(tmp_file_path, sr=22050)
        
        # 算法处理
        basic_features = process_audio_data(y, sr)
        chroma_data = extract_chroma_data(y, sr, basic_features["onset_times"])
        
        chart_data = []
        step = 5 
        for t, s in zip(basic_features["times"][::step], basic_features["strength"][::step]):
            chart_data.append({"time": round(float(t), 2), "value": round(float(s), 4)})

        return {
            "duration": basic_features["duration"],
            "onset_count": len(basic_features["onset_times"]),
            "strength_curve": chart_data,
            "onset_times": basic_features["onset_times"],
            "melody": chroma_data["melody"]
        }

    except Exception as e:
        print(f"❌ 分析失败: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"文件处理失败: {str(e)}")

    finally:
        # 清理临时文件
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)

# --- API 2: 双文件对比 ---
@app.post("/api/compare")
async def compare_audio(sample: UploadFile = File(...), practice: UploadFile = File(...)):
    print(f"👉 [Compare] 正在对比: {sample.filename} vs {practice.filename}")
    sample_tmp = ""
    practice_tmp = ""

    try:
        # 处理 Sample
        c1 = await sample.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp1:
            tmp1.write(c1)
            sample_tmp = tmp1.name
        
        # 处理 Practice
        c2 = await practice.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp2:
            tmp2.write(c2)
            practice_tmp = tmp2.name
            
        y1, sr1 = librosa.load(sample_tmp, sr=22050)
        y2, sr2 = librosa.load(practice_tmp, sr=22050)
        
        feat1 = process_audio_data(y1, sr1)
        feat2 = process_audio_data(y2, sr2)
        
        chroma1 = extract_chroma_data(y1, sr1, feat1["onset_times"])
        chroma2 = extract_chroma_data(y2, sr2, feat2["onset_times"])
        
        dtw_result = compute_dtw(
            chroma1["onset_times"], chroma1["melody"],
            chroma2["onset_times"], chroma2["melody"]
        )

        return {
            "message": "Comparison complete",
            "dtw_distance": dtw_result["distance"],
            "alignment_path": dtw_result["path"], 
            "sample_onsets": chroma1["onset_times"],
            "practice_onsets": chroma2["onset_times"]
        }

    except Exception as e:
        print(f"❌ 对比失败: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"对比失败: {str(e)}")

    finally:
        if sample_tmp and os.path.exists(sample_tmp):
            os.remove(sample_tmp)
        if practice_tmp and os.path.exists(practice_tmp):
            os.remove(practice_tmp)

# --- API 3: 节奏分析 ---
@app.post("/api/analyze-rhythm")
async def analyze_rhythm_endpoint(sample: UploadFile = File(...), practice: UploadFile = File(...)):
    print(f"👉 [Rhythm] 节奏分析: {sample.filename} vs {practice.filename}")
    sample_tmp = ""
    practice_tmp = ""

    try:
        c1 = await sample.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp1:
            tmp1.write(c1)
            sample_tmp = tmp1.name
        
        c2 = await practice.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp2:
            tmp2.write(c2)
            practice_tmp = tmp2.name

        y_ref, sr = librosa.load(sample_tmp, sr=22050)
        y_stu, sr = librosa.load(practice_tmp, sr=22050)

        segments, total_duration = calculate_rhythm_segments(y_ref, y_stu, sr)
        
        return {
            "message": "Rhythm analysis complete",
            "total_duration": total_duration,
            "segments": segments 
        }

    except Exception as e:
        print(f"❌ 节奏分析失败: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"节奏分析失败: {str(e)}")

    finally:
        if sample_tmp and os.path.exists(sample_tmp):
            os.remove(sample_tmp)
        if practice_tmp and os.path.exists(practice_tmp):
            os.remove(practice_tmp)


# ==========================================
# 2. 静态文件服务 (部署关键 - 必须放在最后)
# ==========================================

# 确保 static 目录存在（本地调试时防止报错）
if not os.path.exists("static"):
    os.makedirs("static")

# 挂载 /assets 路径 (Vite 构建的 JS/CSS 都在这里)
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")

# 挂载根目录 "/" 
# 这会让 http://your-domain.com/bg2.png 直接访问到 static/bg2.png
# html=True 表示如果访问根目录，自动返回 index.html
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# --- SPA 路由兜底处理 ---
# 当用户刷新 React 路由页面（如 /dashboard）时，后端没有这个文件，
# 需要拦截 404 并返回 index.html，让前端接管路由。
@app.exception_handler(404)
async def not_found(request: Request, exc):
    # 如果请求的是 API，直接返回 404 JSON，不要返回 HTML
    if request.url.path.startswith("/api"):
        return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
    
    # 对于其他路径 (如页面路由)，返回 React 的入口文件
    index_path = "static/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse(status_code=404, content={"detail": "Frontend not found"})

if __name__ == "__main__":
    # Hugging Face 这里的 PORT 环境变量是 7860
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)