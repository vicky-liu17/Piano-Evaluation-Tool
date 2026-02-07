// src/components/StarRating.jsx
import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import './StarRating.css';

const StarRating = ({ rating, maxStars = 5 }) => {
  return (
    <div className="star-container">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1; // 当前星星代表的值 (1, 2, 3, 4, 5)
        
        // 逻辑判断
        if (rating >= starValue) {
          // 全星
          return (
            <div key={index} className="star-wrapper">
              <Star className="star-icon active" />
            </div>
          );
        } else if (rating >= starValue - 0.5) {
          // 半星 (x.5)
          return (
            <div key={index} className="star-wrapper">
              {/* 底层放一个空的灰色星，上面叠一个半星，防止镂空 */}
              <Star className="star-icon inactive absolute-bg" />
              <StarHalf className="star-icon active" />
            </div>
          );
        } else {
          // 空星
          return (
            <div key={index} className="star-wrapper">
              <Star className="star-icon inactive" />
            </div>
          );
        }
      })}
    </div>
  );
};

export default StarRating;