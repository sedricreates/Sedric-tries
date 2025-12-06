/**
 * Ensemble analysis utilities for multi-image disease detection
 * Implements majority voting and confidence averaging
 */

export interface ImageAnalysis {
  diseaseName: string;
  confidence: number;
  diseaseDescription: string;
  causes: string;
  conditions: string;
  impact: string;
  chemicalControl: string;
  culturalTreatment: string;
  drainageSolutions: string;
  organicProtection: string;
}

export interface EnsembleResult {
  finalDiseaseName: string;
  finalConfidence: number;
  confidenceLevel: "high" | "medium" | "low" | "uncertain";
  analyses: ImageAnalysis[];
  votingResult: {
    votes: Record<string, number>;
    winner: string;
    consensus: boolean;
  };
  recommendation: string;
}

/**
 * Perform ensemble analysis on multiple disease detections
 * Uses majority voting for disease name and averages confidence for the winning disease
 */
export function performEnsembleAnalysis(analyses: ImageAnalysis[]): EnsembleResult {
  if (analyses.length === 0) {
    return {
      finalDiseaseName: "Unknown",
      finalConfidence: 0,
      confidenceLevel: "uncertain",
      analyses: [],
      votingResult: {
        votes: {},
        winner: "Unknown",
        consensus: false,
      },
      recommendation: "No analyses available",
    };
  }

  // Count votes for each disease
  const votes: Record<string, number> = {};
  const diseaseConfidences: Record<string, number[]> = {};

  for (const analysis of analyses) {
    const diseaseName = analysis.diseaseName;
    votes[diseaseName] = (votes[diseaseName] || 0) + 1;

    if (!diseaseConfidences[diseaseName]) {
      diseaseConfidences[diseaseName] = [];
    }
    diseaseConfidences[diseaseName].push(analysis.confidence);
  }

  // Find the winner (most votes)
  let winner = "";
  let maxVotes = 0;

  for (const [disease, voteCount] of Object.entries(votes)) {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winner = disease;
    }
  }

  // Calculate average confidence for the winning disease
  const winnerConfidences = diseaseConfidences[winner] || [];
  const finalConfidence =
    winnerConfidences.length > 0
      ? Math.round(
          winnerConfidences.reduce((a, b) => a + b, 0) / winnerConfidences.length
        )
      : 0;

  // Determine confidence level
  let confidenceLevel: "high" | "medium" | "low" | "uncertain";
  if (finalConfidence >= 80) {
    confidenceLevel = "high";
  } else if (finalConfidence >= 50) {
    confidenceLevel = "medium";
  } else if (finalConfidence >= 30) {
    confidenceLevel = "low";
  } else {
    confidenceLevel = "uncertain";
  }

  // Check for consensus (all images agree)
  const consensus = Object.keys(votes).length === 1;

  // Generate recommendation based on consensus and confidence
  let recommendation = "";
  if (consensus && confidenceLevel === "high") {
    recommendation = "Confirmed Diagnosis - All images agree with high confidence";
  } else if (consensus && confidenceLevel === "medium") {
    recommendation =
      "Likely Diagnosis - All images agree, but confidence is moderate. Consider uploading clearer images.";
  } else if (!consensus && confidenceLevel === "high") {
    recommendation =
      "Mixed signals detected - Most images agree, but some show different symptoms. Review carefully.";
  } else if (!consensus && confidenceLevel === "medium") {
    recommendation =
      "Inconclusive - Images show conflicting symptoms. Please upload clearer close-up images.";
  } else {
    recommendation =
      "Unable to diagnose with confidence - Please upload clearer images from different angles.";
  }

  return {
    finalDiseaseName: winner,
    finalConfidence,
    confidenceLevel,
    analyses,
    votingResult: {
      votes,
      winner,
      consensus,
    },
    recommendation,
  };
}

/**
 * Determine if a diagnosis requires more images for verification
 */
export function needsMoreImages(
  confidence: number,
  confidenceLevel: string,
  imageCount: number
): boolean {
  // Always ask for more images if confidence is low or uncertain
  if (confidenceLevel === "low" || confidenceLevel === "uncertain") {
    return true;
  }

  // For medium confidence, ask for more images if we only have 1
  if (confidenceLevel === "medium" && imageCount === 1) {
    return true;
  }

  return false;
}

/**
 * Get image quality feedback based on confidence
 */
export function getImageQualityFeedback(confidence: number): string[] {
  if (confidence >= 80) {
    return [];
  }

  const feedback: string[] = [];

  if (confidence < 50) {
    feedback.push("Image quality is too low for accurate diagnosis");
    feedback.push("Try taking a close-up photo of the most affected leaf");
    feedback.push("Ensure good lighting without harsh shadows or glare");
    feedback.push("Avoid including too much background");
    feedback.push("Make sure the leaf is in focus and not blurry");
  } else if (confidence < 70) {
    feedback.push("Image could be clearer for better accuracy");
    feedback.push("Try a closer angle on the affected area");
    feedback.push("Ensure the leaf surface is fully visible");
  }

  return feedback;
}
0

