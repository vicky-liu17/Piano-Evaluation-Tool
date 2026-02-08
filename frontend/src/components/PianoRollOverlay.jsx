// src/components/PianoRollOverlay.jsx
import React, { useRef, useEffect } from 'react';
import './PianoRollOverlay.css';

const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// 🆕 映射后端状态到 CSS 类名 (不再使用硬编码颜色值)
const RHYTHM_STATUS_CLASS_MAP = {
  "Too Slow": "rhythm-slow",
  "Good": "rhythm-steady",
  "Too Fast": "rhythm-fast"
};

// 🆕 新的显示标签文本
const RHYTHM_LABELS = {
  "Too Slow": "SLOW",
  "Good": "STEADY",
  "Too Fast": "FAST"
};

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
  rhythmSegments = [], 
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

  // 布局常量
  const PIANO_GRID_HEIGHT = ROW_HEIGHT * 12; // 360px
  const RHYTHM_MARGIN_TOP = 30; // 间距加大一点，放下标题
  const RHYTHM_HEIGHT = 50;     // 节奏条高度增加一点，更像一个独立的轨道

  const maxContentTime = Math.max(duration, ...sampleOnsets, ...practiceOnsets, 0);
  const totalWidth = Math.max((maxContentTime + 2) * PIXELS_PER_SECOND, 800);
  const totalHeight = PIANO_GRID_HEIGHT + RHYTHM_MARGIN_TOP + RHYTHM_HEIGHT;

  const scrollContainerRef = useRef(null);
  
  // 滚动跟随逻辑 (保持不变)
  useEffect(() => {
    if (scrollContainerRef.current) {
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const playheadPos = currentTime * PIXELS_PER_SECOND;
      const containerWidth = scrollContainerRef.current.clientWidth;

      if (playheadPos > currentScroll + containerWidth * 0.8) {
        scrollContainerRef.current.scrollTo({
          left: playheadPos - containerWidth * 0.2, 
          behavior: 'auto'
        });
      } else if (playheadPos < currentScroll) {
        scrollContainerRef.current.scrollTo({
          left: playheadPos - containerWidth * 0.1,
          behavior: 'auto'
        });
      }
    }
  }, [currentTime]);

  return (
    <div className="piano-roll-container">
      <div className="piano-roll-header">
        <h3>Analysis View</h3>
        <div className="legend">
          {/* 音符图例 */}
          <div className="legend-item"><span className="dot sample-dot"></span> <span>Standard</span></div>
          <div className="legend-item"><span className="dot practice-dot"></span> <span>You</span></div>
          
          <div className="legend-divider">|</div>
          
          {/* 🆕 节奏图例 (更新为霓虹样式和新文字) */}
          <div className="legend-item">
            <span className="rhythm-neon-box slow"></span> <span>SLOW</span>
          </div>
          <div className="legend-item">
            <span className="rhythm-neon-box steady"></span> <span>STEADY</span>
          </div>
          <div className="legend-item">
            <span className="rhythm-neon-box fast"></span> <span>FAST</span>
          </div>
        </div>
      </div>

      <div className="daw-wrapper" ref={scrollContainerRef}>
        <div className="daw-content" style={{ width: totalWidth, height: totalHeight }}>
          
          {/* 1. 钢琴背景网格 */}
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

          {/* 2. 垂直时间线 */}
          {[...Array(Math.ceil(maxContentTime) + 2)].map((_, i) => (
            <div 
              key={`line-${i}`} 
              className="grid-vertical-line"
              style={{ left: i * PIXELS_PER_SECOND, height: '100%' }}
            >
               <span className="time-label">{i}s</span>
            </div>
          ))}

          {/* 3. 音符块 */}
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
                {note.type === 'sample' && <span className="note-text">{note.pitchName}</span>}
              </div>
            );
          })}

          {/* 🆕 节奏区域的标题指示 */}
          <div 
            className="rhythm-separator-title" 
            style={{ top: PIANO_GRID_HEIGHT + 5 }}
          >
            RHYTHM TIMELINE
          </div>

          {/* 4. 节奏时间轴 (霓虹风格) */}
          <div className="rhythm-track-container" style={{
            top: PIANO_GRID_HEIGHT + RHYTHM_MARGIN_TOP,
            height: RHYTHM_HEIGHT,
            width: totalWidth
          }}>
            {rhythmSegments.map((seg, idx) => {
              const left = seg.start * PIXELS_PER_SECOND;
              const width = (seg.end - seg.start) * PIXELS_PER_SECOND;
              
              // 获取对应的 CSS 类名和显示文本
              const statusClass = RHYTHM_STATUS_CLASS_MAP[seg.status] || '';
              const labelText = RHYTHM_LABELS[seg.status] || seg.status;

              // 宽度足够才显示文字
              const showText = width > 60; 

              return (
                <div 
                  key={idx}
                  // 应用动态类名
                  className={`rhythm-block ${statusClass}`}
                  style={{
                    left: left,
                    width: width,
                  }}
                  title={`${labelText}: ${seg.start.toFixed(2)}s - ${seg.end.toFixed(2)}s`}
                >
                  {showText && <span className="rhythm-text">{labelText}</span>}
                </div>
              );
            })}
          </div>

          {/* 5. 播放头 */}
          <div 
            className="playhead"
            style={{ left: currentTime * PIXELS_PER_SECOND, height: '100%' }}
          >
            <div className="playhead-cap"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PianoRollOverlay;