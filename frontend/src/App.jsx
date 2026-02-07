import React, { useState } from 'react';
import { analyzeAudio, compareAudio } from './api/index.js';
import Waveform from './components/Waveform';
import PianoRollOverlay from './components/PianoRollOverlay';
import ScorePanel from './components/ScorePanel';
import { Music, ArrowRight, Loader2, UploadCloud, Activity, Sparkles } from 'lucide-react';
import './App.css';

function App() {
  // --- 文件与数据状态 ---
  const [sampleFile, setSampleFile] = useState(null);
  const [sampleData, setSampleData] = useState(null);
  const [practiceFile, setPracticeFile] = useState(null);
  const [practiceData, setPracticeData] = useState(null);
  
  // --- 结果状态 ---
  const [dtwResult, setDtwResult] = useState(null);
  
  // --- 播放同步状态 ---
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTrack, setActiveTrack] = useState(null); // 'sample' | 'practice' | null

  // --- UI 状态 ---
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 

  // --- 通用处理逻辑 ---
  
  const processFile = async (file, type) => {
    try {
      if (type === 'sample') setSampleFile(file);
      else setPracticeFile(file);

      const data = await analyzeAudio(file);
      
      if (type === 'sample') setSampleData(data);
      else setPracticeData(data);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please check backend connection.");
    }
  };

  const handleUpload = async (file, type) => {
    if (!file) return;
    setLoading(true);
    await processFile(file, type);
    setLoading(false);
  };

  const loadDemo = async (fileName, type) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/${fileName}`);
      if (!response.ok) throw new Error(`File not found: ${fileName}`);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'audio/mpeg' });
      await processFile(file, type);
    } catch (error) {
      console.error(error);
      alert(`⚠️ Loading failed!\n\nError: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEvaluation = async () => {
    if (!sampleFile || !practiceFile) return;
    setStep(2); 
    try {
      const result = await compareAudio(sampleFile, practiceFile);
      setDtwResult(result);
      setStep(3); 
    } catch (error) {
      alert("Comparison failed.");
      setStep(1);
    }
  };

  const resetApp = () => {
    setSampleFile(null); setSampleData(null);
    setPracticeFile(null); setPracticeData(null);
    setDtwResult(null);
    setCurrentTime(0);
    setActiveTrack(null);
    setStep(1);
  };

  const handlePlayState = (isPlaying, trackName) => {
    if (isPlaying) setActiveTrack(trackName);
    else setActiveTrack(prev => prev === trackName ? null : prev);
  };

  const renderUploadStep = () => (
    <div className="animate-fade-in">
      <div className="app-header">
        <h1>Music Evaluation Tool</h1>
        <p>Upload a standard track and your practice recording to get a score.</p>
      </div>

      <div className="upload-grid">
        {/* Sample Card */}
        <div className={`upload-card sample-theme ${sampleData ? 'completed' : ''}`}>
          <div className="icon-wrapper">
            <Music size={36} color="#d946ef" strokeWidth={2} />
          </div>
          <h3>1. Standard Sample</h3>
          <p>The teacher's demo</p>
          
          <label className="file-label">
            {sampleFile ? "Change File" : "Upload MP3/WAV"}
            <input type="file" hidden accept="audio/*" onChange={(e) => handleUpload(e.target.files[0], 'sample')} />
          </label>

          <div className="demo-divider"><span>OR</span></div>
          <button className="btn-demo" onClick={() => loadDemo('demo_sample.mp3', 'sample')}>
            <Sparkles size={16} /> Use Website Demo
          </button>

          {sampleFile && <span className="filename">{sampleFile.name}</span>}
        </div>

        {/* Practice Card - 已修改按钮组 */}
        <div className={`upload-card practice-theme ${practiceData ? 'completed' : ''}`}>
          <div className="icon-wrapper">
            <UploadCloud size={36} color="#3b82f6" strokeWidth={2} />
          </div>
          <h3>2. Your Practice</h3>
          <p>Your recording</p>
          
          <label className="file-label">
            {practiceFile ? "Change File" : "Upload MP3/WAV"}
            <input type="file" hidden accept="audio/*" onChange={(e) => handleUpload(e.target.files[0], 'practice')} />
          </label>

          <div className="demo-divider"><span>OR</span></div>
          
          {/* 🆕 并排 Demo 按钮组 */}
          <div className="demo-btn-group">
            <button className="btn-demo-split" onClick={() => loadDemo('demo_practice.mp3', 'practice')}>
              <Sparkles size={14} /> Use Demo 1
            </button>
            <button className="btn-demo-split" onClick={() => loadDemo('demo_practice2.mp3', 'practice')}>
              <Sparkles size={14} /> Use Demo 2
            </button>
          </div>

          {practiceFile && <span className="filename">{practiceFile.name}</span>}
        </div>
      </div>

      <div className="action-area">
        <button onClick={startEvaluation} disabled={!sampleData || !practiceData || loading} className="btn-start">
          {loading ? <Loader2 className="animate-spin" /> : <>See My Score <ArrowRight size={24} strokeWidth={3} /></>}
        </button>
      </div>
    </div>
  );

  const renderResultStep = () => (
    <div className="result-container animate-fade-in">
      <ScorePanel 
        dtwDistance={dtwResult.dtw_distance} 
        sampleCount={sampleData.onset_count}
        practiceCount={practiceData.onset_count}
        onReset={resetApp} 
      />
      <div className="dashboard-container">
        <div className="dashboard-inner">
          <div style={{ display: 'grid', gap: '25px' }}>
            <div className="track-section standard">
              <span className="track-label">Standard Track (Green)</span>
              <Waveform 
                audioFile={sampleFile} 
                color="#10b981" 
                onTimeUpdate={(t) => { if (activeTrack === 'sample' || !activeTrack) setCurrentTime(t); }}
                onPlayingStateChange={(state) => handlePlayState(state, 'sample')}
              />
            </div>
            <div className="track-section practice">
              <span className="track-label">Your Recording (Blue)</span>
              <Waveform 
                audioFile={practiceFile} 
                color="#3b82f6"
                onTimeUpdate={(t) => { if (activeTrack === 'practice' || !activeTrack) setCurrentTime(t); }} 
                onPlayingStateChange={(state) => handlePlayState(state, 'practice')}
              />
            </div>
          </div>
          <PianoRollOverlay 
            sampleOnsets={sampleData.onset_times} 
            sampleMelody={sampleData.melody}
            practiceOnsets={practiceData.onset_times}
            practiceMelody={practiceData.melody}
            currentTime={currentTime}
            activeTrack={activeTrack}
            duration={Math.max(sampleData.duration, practiceData.duration)} 
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {step === 1 && renderUploadStep()}
      {step === 2 && (
        <div className="loading-container">
          <Loader2 size={80} color="#d946ef" className="animate-spin" style={{ filter: 'drop-shadow(0 0 10px #d946ef)' }} />
          <h2 className="loading-text">Analyzing Cosmic Data...</h2>
        </div>
      )}
      {step === 3 && renderResultStep()}
    </div>
  );
}

export default App;