// src/utils/scoring.js

export const calculateResult = (dtwDistance, sampleCount, practiceCount) => {
  // 1. 基础防呆
  if (dtwDistance === null || dtwDistance === undefined || !sampleCount || !practiceCount || sampleCount === 0) {
    return { grade: "N/A", color: "#94a3b8" };
  }

  // --- 核心算法 ---
  const avgError = dtwDistance / Math.min(sampleCount, practiceCount); // 每个音符的平均误差

  // --- 🔽 调整 2: 宽松后的阈值表 ---
  let grade = "F";
  let color = "#ef4444"; // Red

  if (avgError <= 1.3) {
    grade = "A+"; color = "#10b981"; // Emerald
  } else if (avgError <= 1.5) {
    grade = "A";  color = "#10b981";
  } else if (avgError <= 1.7) {
    grade = "A-"; color = "#10b981"; 
  } else if (avgError <= 2.0) {
    grade = "B+"; color = "#3b82f6"; // Blue
  } else if (avgError <= 2.3) {
    grade = "B";  color = "#3b82f6"; 
  } else if (avgError <= 2.6) {
    grade = "B-"; color = "#3b82f6"; 
  } else if (avgError <= 3.0) {
    grade = "C+"; color = "#f59e0b"; // Amber
  } else if (avgError <= 3.4) {
    grade = "C";  color = "#f59e0b";
  } else if (avgError <= 3.8) {
    // 🎯 Case 1 (2.01 + 惩罚) 即使到了 3.5-3.8 也会被这里接住，评为 C-
    grade = "C-"; color = "#f59e0b";
  } else if (avgError <= 4.8) {
    // 🎯 Case 2 (2.54 + 惩罚) 会落在这里，评为 D
    grade = "D";  color = "#f97316"; // Orange
  } else {
    grade = "F";  color = "#ef4444"; 
  }

  return { grade, color };
};

// 🔽 调整 3: 星星映射 (支持半星)
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
    case "C-": return 1.5; // 新增 C-
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