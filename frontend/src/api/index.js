// src/api/index.js
import axios from 'axios';

// 配置你的 FastAPI 后端地址
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', 
});

// 上传并分析单个音频
export const analyzeAudio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await API.post('/analyze', formData);
  return response.data;
};

// 对比两个音频 (DTW)
export const compareAudio = async (sampleFile, practiceFile) => {
  const formData = new FormData();
  formData.append('sample', sampleFile);
  formData.append('practice', practiceFile);
  const response = await API.post('/compare', formData);
  return response.data;
};