import numpy as np
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean

def create_chroma_sequence(onset_times, chroma_values, step_size=0.2):
    """
    将稀疏的 onset/chroma 转换为等时间步长的序列，用于 DTW 比较
    """
    if not onset_times:
        return np.array([])
        
    max_time = max(onset_times)
    num_steps = int(np.ceil(max_time / step_size)) + 1
    sequence = np.zeros(num_steps)

    for onset, value in zip(onset_times, chroma_values):
        index = int(onset / step_size)
        if index < num_steps:
            sequence[index] = value

    return sequence

def compute_dtw(sample_times, sample_chroma, practice_times, practice_chroma):
    """
    计算 DTW 并返回前端可用的可视化数据
    """
    # 1. 准备数据
    sample_seq = create_chroma_sequence(sample_times, sample_chroma)
    practice_seq = create_chroma_sequence(practice_times, practice_chroma)
    
    # 2. 计算 DTW
    distance, path = fastdtw(sample_seq, practice_seq, dist=lambda x, y: euclidean([x], [y]))
    
    # 3. 整理返回数据
    # path 是一个 [(0,0), (1,1), ...] 的列表，表示索引的对齐
    # 我们需要把这些索引转换回大概的时间，或者直接传索引给前端
    
    formatted_path = [{"i": int(i), "j": int(j)} for i, j in path]
    
    return {
        "distance": float(distance),
        "path": formatted_path,
        "sample_len": len(sample_seq),
        "practice_len": len(practice_seq)
    }