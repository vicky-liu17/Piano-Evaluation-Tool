// src/utils/scoring.js

export const calculateResult = (dtwDistance, sampleCount, practiceCount) => {
  // 1. 基础防呆
  // N/A 颜色改为较浅的蓝灰色，以便在深色背景下看清
  if (dtwDistance === null || dtwDistance === undefined || !sampleCount || !practiceCount || sampleCount === 0) {
    return { grade: "N/A", color: "#94a3b8" }; 
  }

  // --- 核心算法 ---
  const avgError = dtwDistance / Math.min(sampleCount, practiceCount); // 每个音符的平均误差

  let grade = "F";
  let color = "#ff2a6d"; // Default: Neon Red (Fail)

  // --- 🔽 调整: 适配 Cyberpunk/Arcane 霓虹配色 ---
  
  // A Range: Cyber Cyan (赛博青 - 对应 Standard Track 的完美色)
  if (avgError <= 1.3) {
    grade = "A+"; color = "#00f3ff"; // Neon Cyan
  } else if (avgError <= 1.5) {
    grade = "A";  color = "#00f3ff";
  } else if (avgError <= 1.7) {
    grade = "A-"; color = "#22d3ee"; // Slightly softer Cyan
  } 
  
  // B Range: Neon Purple/Pink (霓虹紫 - 对应 Practice Track 的风格)
  else if (avgError <= 2.0) {
    grade = "B+"; color = "#d946ef"; // Neon Fuchsia
  } else if (avgError <= 2.3) {
    grade = "B";  color = "#c026d3"; // Deep Neon Purple
  } else if (avgError <= 2.6) {
    grade = "B-"; color = "#a855f7"; // Lighter Purple
  } 
  
  // C Range: Neon Gold/Yellow (流光金 - 警告)
  else if (avgError <= 3.0) {
    grade = "C+"; color = "#fcee0a"; // Neon Yellow
  } else if (avgError <= 3.4) {
    grade = "C";  color = "#eab308"; // Gold
  } else if (avgError <= 3.8) {
    grade = "C-"; color = "#d97706"; // Amber
  } 
  
  // D Range: Neon Orange (荧光橙 - 差)
  else if (avgError <= 4.8) {
    grade = "D";  color = "#ff9f43"; // Neon Orange
  } 
  
  // F Range: Neon Red (赤红 - 失败)
  else {
    grade = "F";  color = "#ff2a6d"; // Radical Red
  }

  return { grade, color };
};

// 🔽 星星映射 (保持不变)
export const getStarCount = (grade) => {
  switch (grade) {
    case "A+": return 5;
    case "A":  return 5;
    case "A-": return 4.5;
    case "B+": return 4;
    case "B":  return 3.5;
    case "B-": return 3;
    case "C+": return 2.5;
    case "C":  return 2;
    case "C-": return 1.5;
    case "D":  return 1;
    case "F":  return 0;
    default: return 0;
  }
};

export const getFeedback = (grade) => {
  if (grade.startsWith("A")) return "Excellent! Pitch and rhythm are spot on.";
  if (grade.startsWith("B")) return "Great job! A few timing variations.";
  if (grade.startsWith("C")) return "Fair. Check your note accuracy and tempo.";
  if (grade === "D") return "It sounds different. Are you playing the right song?";
  return "Mismatch detected. Please check if you uploaded the correct files.";
};