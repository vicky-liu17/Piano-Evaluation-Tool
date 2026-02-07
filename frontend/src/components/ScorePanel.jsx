// src/components/ScorePanel.jsx
import React from 'react';
import { calculateResult, getStarCount, getFeedback } from '../utils/scoring';
import StarRating from './StarRating';
import { RefreshCcw } from 'lucide-react';
import './ScorePanel.css';

const ScorePanel = ({ dtwDistance, sampleCount, practiceCount, onReset }) => {
  
  // 计算结果 (score 和 debugInfo 虽然算出来了，但我们不显示)
  const { grade, color } = calculateResult(dtwDistance, sampleCount, practiceCount);
  const starCount = getStarCount(grade);

  return (
    <div className="score-panel animate-fade-in">
      <h2>Evaluation Grade</h2>
      
      {/* 只有大大的等级，没有数字干扰 */}
      <div className="score-circle" style={{ borderColor: color }}>
        <span className="score-grade" style={{ color: color }}>{grade}</span>
      </div>

      {/* 支持半星的评分组件 */}
      <StarRating rating={starCount} />

      <p className="feedback-text">
        "{getFeedback(grade)}"
      </p>

      {/* 调试信息区域已完全删除 */}

      <button onClick={onReset} className="retry-btn">
        <RefreshCcw size={16} /> Try Another Song
      </button>
    </div>
  );
};

export default ScorePanel;