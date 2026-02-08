# 🎹 AI Piano Evaluator (Beginner Edition)

**Your Personal AI Piano Tutor — Practice with Confidence, Progress with Clarity.**

AI Piano Evaluator is an intelligent assessment tool designed specifically for piano beginners. It "listens" to your playing just like a real teacher, identifying what you did well and where you can improve. No more guessing during your home practice sessions—get instant, data-driven feedback!

---

## ✨ Key Features (Beginner-Friendly)

* **🎯 AI Smart Scoring**: The AI automatically aligns your practice recording with a standard performance. It evaluates your play based on two dimensions—**Pitch Accuracy** and **Rhythmic Precision**—giving you a clear score to track your daily progress.
* **🚥 Rhythm Traffic Lights**: Mastering tempo is the biggest challenge for beginners. Our intuitive "Traffic Light" system shows you exactly how you performed:
    * 🔴 **Too Fast**: You might be rushing due to nerves or difficult sections.
    * 🟡 **Too Slow**: You might need more practice with fingering or sight-reading here.
    * 🟢 **Good**: Perfect timing! Keep it up.
* **🎵 Pitch Correction Analysis**: Using AI melody extraction, the app checks if you hit the right notes, helping you build a solid musical foundation from day one.
* **🌌 Immersive Cyberpunk UI**: Practice doesn't have to be boring. The futuristic, game-like interface turns every exercise into an exciting "musical mission."

---

## 🛠️ Three Easy Steps to Start

1.  **Prepare Sample**: Upload a standard version of the piece you are learning (MP3/WAV).
2.  **Record Practice**: Upload the recording of your recent practice session.
3.  **Get Your Report**: Click "Analyze." Within seconds, the AI generates a detailed report with rhythmic suggestions tailored for you.

---

## 🚀 The Technology (For Teachers & Parents)

This application uses industry-standard audio processing to ensure scientific accuracy:
* **Alignment Algorithm**: Employs **Dynamic Time Warping (DTW)** to handle the unstable tempos common in beginner performances.
* **Feature Extraction**: Uses **Chroma CQT** to analyze melodies, ensuring high accuracy even in recordings with background noise.
* **Trend Detection**: Calculates local slopes via a sliding window to pinpoint exactly where rhythmic deviations occur.

---

## 💻 Local Setup & Development

Follow these steps to run the **AI Piano Evaluator** on your local machine.

### 1. Prerequisites
* **Python 3.9+**
* **Node.js 18+**
* **FFmpeg**: Required for audio processing. 
  * *macOS*: `brew install ffmpeg`
  * *Ubuntu*: `sudo apt install ffmpeg`
  * *Windows*: Download from the FFmpeg official site and add to your PATH.

### 2. Backend Installation
```bash
cd backend
pip install -r ../requirements.txt
python main.py

```

The backend will start at `http://localhost:7860`.

### 3. Frontend Installation

```bash
cd frontend
npm install
npm run dev

```

The frontend will start at `http://localhost:5173`. You can now access the app in your browser!