#audio_utils.py
import librosa
import numpy as np
from scipy.ndimage import gaussian_filter1d

def process_audio_data(y, sr):
    """
    基础分析：提取 Onset Strength 和 Onset Times
    """
    # 1. 计算 Onset Strength Envelope (用于画折线图)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    times = librosa.times_like(onset_env, sr=sr)
    
    # 2. 检测具体的 Onset 时间点 (用于在波形上标记竖线)
    onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    
    # 为了减少网络传输量，可以对 envelope 进行简单的降采样 (例如每3个点取1个)
    # 但如果数据量不大，保留全部细节也可以
    
    return {
        "duration": librosa.get_duration(y=y, sr=sr),
        "times": times.tolist(),
        "strength": onset_env.tolist(),
        "onset_times": onset_times.tolist()
    }

def extract_chroma_data(y, sr, onset_times):
    """
    提取钢琴卷帘 (Piano Roll) 数据
    """
    # 计算 Chroma 特征 (CQT)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    
    # 将时间转换为帧
    onset_frames = librosa.time_to_frames(onset_times, sr=sr)
    
    onset_melody = []
    valid_onset_times = []
    
    # 获取每个 Onset 处的音高
    for i, onset_frame in enumerate(onset_frames):
        if onset_frame < chroma.shape[1]:
            # 找到这一帧里能量最大的音符 (0=C, 1=C#, ..., 11=B)
            dominant_pitch = np.argmax(chroma[:, onset_frame])
            onset_melody.append(int(dominant_pitch))
            valid_onset_times.append(onset_times[i])
            
    return {
        "onset_times": valid_onset_times, # 已经是 list 了
        "melody": onset_melody # list of ints
    }

# ==========================================
# 新增：节奏分析核心算法
# ==========================================

def merge_short_segments(segments, min_duration=1.5):
    """
    清理过短的碎片：如果一段状态持续时间小于 min_duration，将其合并到前一段。
    """
    if not segments:
        return []
    
    # 初始放入第一段
    merged = [segments[0].copy()]
    
    for i in range(1, len(segments)):
        current = segments[i].copy()
        prev = merged[-1]
        
        current_dur = current['end'] - current['start']
        
        # 逻辑：如果状态相同，或者当前片段太短（且不是最后一段），则合并
        if current['status'] == prev['status'] or current_dur < min_duration:
            # 延长前一段的结束时间
            prev['end'] = current['end']
        else:
            # 否则添加新片段
            merged.append(current)
            
    return merged

def calculate_rhythm_segments(y_ref, y_stu, sr):
    """
    输入音频数组，返回节奏状态片段列表
    """
    # 1. 提取 Chroma 特征
    # 使用 CQT (Constant-Q transform) 对音高变化敏感，适合旋律对齐
    chroma_ref = librosa.feature.chroma_cqt(y=y_ref, sr=sr)
    chroma_stu = librosa.feature.chroma_cqt(y=y_stu, sr=sr)

    # 2. DTW 计算 (Dense DTW)
    # 注意：这里使用 librosa 自带的 dense DTW，而不是 fastdtw，因为我们需要连续的时间路径
    D, wp = librosa.sequence.dtw(X=chroma_stu, Y=chroma_ref, metric='cosine')
    wp = wp[::-1] # 反转路径使其按时间正序
    
    # 将帧索引转换为时间
    wp_times = librosa.frames_to_time(wp, sr=sr, hop_length=512)
    student_times = wp_times[:, 0]
    ref_times = wp_times[:, 1]

    # 3. 分析节奏趋势 (平滑处理)
    dt = 0.5  # 每 0.5 秒采样一次
    # 防止 student_times 为空或太短
    if len(student_times) == 0 or student_times[-1] <= 0:
        return [], 0

    sample_t = np.arange(0, student_times[-1], dt)
    if len(sample_t) < 2:
        return [], student_times[-1]

    # 插值：找到这些时刻对应的老师时间
    ref_interp = np.interp(sample_t, student_times, ref_times)
    
    # 计算斜率 (微分)
    slopes = np.diff(ref_interp) / dt
    
    # 高斯平滑
    slopes_smooth = gaussian_filter1d(slopes, sigma=1) 

    # 4. 阈值判定
    raw_segments = []
    THRESHOLD_FAST = 1.25 
    THRESHOLD_SLOW = 0.8
    
    current_status = "Good"
    seg_start = 0.0
    
    for i, s in enumerate(slopes_smooth):
        t = float(sample_t[i])
        
        if s > THRESHOLD_FAST:
            status = "Too Fast"
        elif s < THRESHOLD_SLOW:
            status = "Too Slow"
        else:
            status = "Good"
            
        if status != current_status:
            raw_segments.append({
                "start": seg_start, 
                "end": t, 
                "status": current_status
            })
            current_status = status
            seg_start = t
            
    # 添加最后一段
    raw_segments.append({
        "start": seg_start, 
        "end": float(sample_t[-1]), 
        "status": current_status
    })

    # 5. 合并微小片段 (第二次去噪)
    final_segments = merge_short_segments(raw_segments, min_duration=2.0)
    
    total_duration = float(student_times[-1])
    
    return final_segments, total_duration