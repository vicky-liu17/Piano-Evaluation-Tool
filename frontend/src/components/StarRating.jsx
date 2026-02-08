// src/components/StarRating.jsx
import React from 'react';
import './StarRating.css';

const StarRating = ({ rating, maxStars = 5 }) => {
  // 核心逻辑：将 5星制 转换为 10格制
  // 例如: 4.5 * 2 = 9 格
  const maxCells = 10;
  const activeCells = Math.round(rating * 2);

  // 计算当前的同步率百分比 (用于显示文字)
  const syncRate = Math.round((activeCells / maxCells) * 100);

  // 根据能量等级决定颜色主题 (CSS 类名)
  let powerTheme = 'low'; // Red
  if (activeCells >= 8) powerTheme = 'high'; // Cyan
  else if (activeCells >= 5) powerTheme = 'mid'; // Purple

  return (
    <div className={`cyber-power-container ${powerTheme}`}>
      {/* 顶部文字指示器 */}
      <div className="power-header">
        <span className="power-label">SYNC RATE</span>
        <span className="power-value">{syncRate}%</span>
      </div>

      {/* 能量条主体 */}
      <div className="power-bar-track">
        {[...Array(maxCells)].map((_, index) => {
          // 判断当前格是否激活
          const isActive = index < activeCells;
          
          return (
            <div 
              key={index} 
              className={`power-cell ${isActive ? 'active' : ''}`}
            ></div>
          );
        })}
      </div>
      
      {/* 底部装饰线 */}
      <div className="power-decoration-line"></div>
    </div>
  );
};

export default StarRating;