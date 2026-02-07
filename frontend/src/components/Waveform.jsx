// src/components/Waveform.jsx
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause } from 'lucide-react';

const Waveform = ({ audioFile, color = '#4F46E5', onTimeUpdate, onPlayingStateChange }) => {
  const containerRef = useRef(null);
  const wavesurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !audioFile) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#475569', // Slate 600
      progressColor: color,
      cursorColor: 'transparent', // 隐藏 Wavesurfer 自带的光标，我们有红线了
      barWidth: 2,
      height: 60,
      responsive: true,
      normalize: true,
      interact: true, 
    });

    wavesurferRef.current = ws;

    // --- 事件绑定 ---
    // 播放时通知父组件
    ws.on('play', () => {
      setIsPlaying(true);
      if(onPlayingStateChange) onPlayingStateChange(true);
    });
    // 暂停/结束时通知父组件
    ws.on('pause', () => {
      setIsPlaying(false);
      if(onPlayingStateChange) onPlayingStateChange(false);
    });
    ws.on('finish', () => {
      setIsPlaying(false);
      if(onPlayingStateChange) onPlayingStateChange(false);
    });

    // 实时更新时间 (高频触发)
    ws.on('audioprocess', (currentTime) => {
      if (onTimeUpdate) onTimeUpdate(currentTime);
    });

    // 用户点击进度条跳转
    ws.on('interaction', (newTime) => {
      if (onTimeUpdate) onTimeUpdate(newTime);
    });

    const url = URL.createObjectURL(audioFile);
    ws.load(url).catch((err) => {
      if (err.name === 'AbortError') return;
      console.error(err);
    });

    return () => {
      try { ws.destroy(); } catch (e) {}
      URL.revokeObjectURL(url);
    };
  }, [audioFile, color]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div style={{ padding: '10px', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
        <button onClick={togglePlay} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: color }}>
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'200px' }}>
          {audioFile.name}
        </span>
      </div>
      <div ref={containerRef} />
    </div>
  );
};

export default Waveform;