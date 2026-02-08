// src/components/ScorePanel.jsx
import React from 'react';
import { calculateResult, getStarCount, getFeedback } from '../utils/scoring';
import StarRating from './StarRating';
import { RefreshCcw, Activity } from 'lucide-react';
import './ScorePanel.css';

const ScorePanel = ({ dtwDistance, sampleCount, practiceCount, onReset }) => {
  
  const { grade, color } = calculateResult(dtwDistance, sampleCount, practiceCount);
  const starCount = getStarCount(grade);

  return (
    // 这里的 style 只会影响内部使用了 var(--score-color) 的元素
    // 外部容器的边框颜色已经在 CSS 里写死为紫色了
    <div className="score-panel animate-fade-in" style={{ '--score-color': color }}>
      
      {/* 装饰元素 */}
      <div className="cyber-corner top-left"></div>
      <div className="cyber-corner top-right"></div>
      <div className="cyber-corner bottom-left"></div>
      <div className="cyber-corner bottom-right"></div>
      <div className="cyber-bg-grid"></div>

      <div className="score-content">
        {/* 左侧：动态等级圆环 */}
        <div className="grade-section">
          <div className="grade-circle-glow">
            <span className="grade-text">{grade}</span>
          </div>
          <span className="grade-label">RANK</span>
        </div>

        {/* 右侧：数据与操作 */}
        <div className="info-section">
          <div className="info-header">
            {/* 这个小图标保留动态色，作为点缀 */}
            <Activity size={14} color={color} style={{ opacity: 0.8 }} />
            <span>ANALYSIS COMPLETE</span>
          </div>
          
          <div className="rating-wrapper">
             <StarRating rating={starCount} />
          </div>

          <p className="feedback-text">
            &gt; {getFeedback(grade)}
          </p>

          <button onClick={onReset} className="retry-btn">
            <RefreshCcw size={14} /> 
            <span>RETRY MISSION</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScorePanel;