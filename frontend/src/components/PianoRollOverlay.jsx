// src/components/PianoRollOverlay.jsx
import React, { useRef, useEffect } from 'react';
import './PianoRollOverlay.css';

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const processNotes = (onsets, melody, type) => {
  if (!onsets || !melody) return [];
  return onsets.map((t, i) => ({
    time: t,
    pitch: melody[i],
    pitchName: PITCH_CLASSES[melody[i]],
    type: type,
    id: `${type}-${i}`
  }));
};

const PianoRollOverlay = ({ 
  sampleOnsets, sampleMelody, 
  practiceOnsets, practiceMelody, 
  currentTime = 0, 
  activeTrack,
  duration = 0 
}) => {
  
  const sampleNotes = processNotes(sampleOnsets, sampleMelody, 'sample');
  const practiceNotes = processNotes(practiceOnsets, practiceMelody, 'practice');
  const allNotes = [...sampleNotes, ...practiceNotes];

  const PIXELS_PER_SECOND = 100; 
  const NOTE_WIDTH = 30;
  const ROW_HEIGHT = 30;

  // 计算总宽度：保证至少能放下所有内容
  const maxContentTime = Math.max(duration, ...sampleOnsets, ...practiceOnsets, 0);
  const totalWidth = Math.max((maxContentTime + 2) * PIXELS_PER_SECOND, 800);

  const scrollContainerRef = useRef(null);
  
  // 🔴 核心修复 2: 滚动逻辑
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const playheadPos = currentTime * PIXELS_PER_SECOND;
      const containerWidth = scrollContainerRef.current.clientWidth;

      // 策略：当红线跑到屏幕右侧 80% 处，"啪"地一下翻页过去
      if (playheadPos > currentScroll + containerWidth * 0.8) {
        scrollContainerRef.current.scrollTo({
          left: playheadPos - containerWidth * 0.2, 
          behavior: 'auto' // ⚠️ 必须用 auto (瞬间跳转)，用 smooth 会因为动画延迟导致跟不上
        });
      } 
      // 回跳逻辑
      else if (playheadPos < currentScroll) {
        scrollContainerRef.current.scrollTo({
          left: playheadPos - containerWidth * 0.1,
          behavior: 'auto' // 同理
        });
      }
    }
  }, [currentTime]);

  return (
    <div className="piano-roll-container">
      <div className="piano-roll-header">
        <h3>🎹 Piano Roll</h3>
        <div className="legend">
          <div className="legend-item" style={{display:'flex', alignItems:'center'}}>
            <span className="dot sample-dot"></span> 
            <span style={{color: '#94a3b8'}}>Standard (Green)</span>
          </div>
          <div className="legend-item" style={{display:'flex', alignItems:'center'}}>
            <span className="dot practice-dot"></span> 
            <span style={{color: '#3b82f6'}}>You (Blue)</span>
          </div>
        </div>
      </div>

      <div className="daw-wrapper" ref={scrollContainerRef}>
        {/* 这里加上了 className daw-content，CSS 里给了 position: relative */}
        <div className="daw-content" style={{ width: totalWidth, height: ROW_HEIGHT * 12 }}>
          
          {/* 背景网格 */}
          {PITCH_CLASSES.slice().reverse().map((note, index) => {
            const isBlackKey = note.includes('#');
            return (
              <div 
                key={note} 
                className={`grid-row ${isBlackKey ? 'black-key' : 'white-key'}`}
                style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
              >
                <span className="key-label">{note}</span>
              </div>
            );
          })}

          {/* 垂直时间线 */}
          {[...Array(Math.ceil(maxContentTime) + 2)].map((_, i) => (
            <div 
              key={`line-${i}`} 
              className="grid-vertical-line"
              style={{ left: i * PIXELS_PER_SECOND }}
            >
               <span className="time-label">{i}s</span>
            </div>
          ))}

          {/* 音符块 */}
          {allNotes.map((note) => {
            const top = (11 - note.pitch) * ROW_HEIGHT;
            const left = note.time * PIXELS_PER_SECOND;
            
            let shouldGlow = false;
            if (activeTrack && note.type === activeTrack) {
               shouldGlow = Math.abs(currentTime - note.time) < 0.15;
            }
            
            return (
              <div
                key={note.id}
                className={`note-block ${note.type} ${shouldGlow ? 'active-glow' : ''}`}
                style={{
                  left: left,
                  top: top + 2,
                  width: NOTE_WIDTH,
                  height: ROW_HEIGHT - 4,
                }}
              >
                {note.type === 'sample' && (
                  <span className="note-text">{note.pitchName}</span>
                )}
              </div>
            );
          })}

          {/* 播放头 */}
          <div 
            className="playhead"
            style={{ left: currentTime * PIXELS_PER_SECOND }}
          >
            <div className="playhead-cap"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PianoRollOverlay;