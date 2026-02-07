import librosa
import numpy as np

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