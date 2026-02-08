import axios from 'axios';

const API = axios.create({
  baseURL: '/api', 
});

export const analyzeAudio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await API.post('/analyze', formData);
  return response.data;
};

export const compareAudio = async (sampleFile, practiceFile) => {
  const formData = new FormData();
  formData.append('sample', sampleFile);
  formData.append('practice', practiceFile);
  const response = await API.post('/compare', formData);
  return response.data;
};

// 🆕 新增：节奏分析接口
export const analyzeRhythm = async (sampleFile, practiceFile) => {
  const formData = new FormData();
  formData.append('sample', sampleFile);
  formData.append('practice', practiceFile);
  const response = await API.post('/analyze-rhythm', formData);
  return response.data;
};