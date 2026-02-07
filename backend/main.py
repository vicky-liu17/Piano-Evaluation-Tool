from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import io
import librosa
import numpy as np
import traceback
import os
import tempfile

# 导入我们需要的功能模块
from audio_utils import process_audio_data, extract_chroma_data
from dtw_utils import compute_dtw

app = FastAPI()

# --- CORS 配置 ---
# 允许 React (通常在 localhost:5173) 访问后端
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 辅助函数：统一加载音频 ---
async def load_audio(file: UploadFile):
    try:
        content = await file.read()
        # 统一采样率 22050，单声道
        y, sr = librosa.load(io.BytesIO(content), sr=22050, mono=True)
        return y, sr
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading audio file: {str(e)}")

@app.get("/")
def home():
    return {"message": "Music Evaluation API is running"}

# --- API 1: 单文件分析 (Onset Strength & Chroma) ---
@app.post("/api/analyze")
async def analyze_audio(file: UploadFile = File(...)):
    print(f"👉 正在处理文件: {file.filename}")
    
    # 定义临时文件路径变量，方便后面清理
    tmp_file_path = ""

    try:
        # 1. 读取上传的文件内容
        content = await file.read()
        print(f"✅ 文件读取成功，大小: {len(content)} bytes")
        
        # ================== 核心修改开始 ==================
        # 2. 创建一个临时文件，把内容写进去
        # delete=False 让我们手动控制删除，suffix=".mp3" 告诉 librosa 这是个 MP3
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
            tmp.write(content)
            tmp_file_path = tmp.name  # 获取临时文件的绝对路径
        
        print(f"💾 已保存到临时文件: {tmp_file_path}")

        # 3. 让 librosa 读取这个“真实存在的文件”，而不是内存流
        # 这样它就能正确调用 ffmpeg 了
        y, sr = librosa.load(tmp_file_path, sr=22050)
        print("✅ Librosa 加载成功！")
        # ================== 核心修改结束 ==================

        # --- 这里是你原本的处理逻辑 (Audio Utils) ---
        basic_features = process_audio_data(y, sr)
        chroma_data = extract_chroma_data(y, sr, basic_features["onset_times"])
        
        chart_data = []
        step = 5 
        for t, s in zip(basic_features["times"][::step], basic_features["strength"][::step]):
            chart_data.append({"time": round(float(t), 2), "value": round(float(s), 4)})

        # 构造返回数据
        result = {
            "duration": basic_features["duration"],
            "onset_count": len(basic_features["onset_times"]),
            "strength_curve": chart_data,
            "onset_times": basic_features["onset_times"],
            "melody": chroma_data["melody"]
        }
        
        return result

    except Exception as e:
        print(f"❌ 处理失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"文件处理失败: {str(e)}")

    finally:
        # 4. 清理现场：无论成功失败，都要删除临时文件
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.remove(tmp_file_path)
            print("🧹 临时文件已清理")

# --- API 2: 双文件对比 (DTW) ---
@app.post("/api/compare")
async def compare_audio(sample: UploadFile = File(...), practice: UploadFile = File(...)):
    """
    接收两个文件 (Sample, Practice)，计算 DTW 相似度
    (已升级：使用临时文件处理，兼容 MP3)
    """
    sample_tmp_path = ""
    practice_tmp_path = ""

    try:
        # --- 1. 处理 Sample 文件 ---
        content1 = await sample.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp1:
            tmp1.write(content1)
            sample_tmp_path = tmp1.name
        
        # --- 2. 处理 Practice 文件 ---
        content2 = await practice.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp2:
            tmp2.write(content2)
            practice_tmp_path = tmp2.name
            
        # --- 3. Librosa 读取 (从临时文件) ---
        print(f"正在对比: {sample_tmp_path} vs {practice_tmp_path}")
        y1, sr1 = librosa.load(sample_tmp_path, sr=22050)
        y2, sr2 = librosa.load(practice_tmp_path, sr=22050)
        
        # --- 4. 提取特征 & 计算 DTW (保持原有逻辑) ---
        feat1 = process_audio_data(y1, sr1)
        feat2 = process_audio_data(y2, sr2)
        
        chroma1 = extract_chroma_data(y1, sr1, feat1["onset_times"])
        chroma2 = extract_chroma_data(y2, sr2, feat2["onset_times"])
        
        dtw_result = compute_dtw(
            chroma1["onset_times"], chroma1["melody"],
            chroma2["onset_times"], chroma2["melody"]
        )

        raw_distance = dtw_result["distance"]
        note_count = len(chroma1["onset_times"])
        avg_error = raw_distance / note_count if note_count > 0 else 0

        print("\n" + "="*40)
        print(f"🔍 [调试模式] DTW 原始距离 (总误差): {raw_distance}")
        print(f"🎵 [调试模式] 标准音符数量: {note_count}")
        print(f"📉 [调试模式] 平均单音符误差: {avg_error}")
        print("="*40 + "\n")
        
        return {
            "message": "Comparison complete",
            "dtw_distance": dtw_result["distance"],
            "alignment_path": dtw_result["path"], 
            "sample_onsets": chroma1["onset_times"],
            "practice_onsets": chroma2["onset_times"]
        }

    except Exception as e:
        print(f"❌ 对比失败: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"对比失败: {str(e)}")

    finally:
        # --- 5. 清理临时文件 ---
        if sample_tmp_path and os.path.exists(sample_tmp_path):
            os.remove(sample_tmp_path)
        if practice_tmp_path and os.path.exists(practice_tmp_path):
            os.remove(practice_tmp_path)
        print("🧹 对比临时文件已清理")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)