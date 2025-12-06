import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  createDetection,
  updateDetection,
  getDetectionById,
  getUserDetections,
  createDetectionImage,
  getDetectionImages,
  updateDetectionEnsemble,
} from "./db";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { performEnsembleAnalysis, needsMoreImages, getImageQualityFeedback } from "./ensemble";

/**
 * Analyze a single plant image for disease detection
 */
async function analyzeImage(imageUrl: string): Promise<any> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert plant pathologist helping farmers identify crop diseases. Analyze the plant image and provide a clear, actionable diagnosis.

Your response must be in JSON format with this exact structure:
{
  "isHealthy": boolean,
  "diseaseName": string,
  "confidence": number (0-100),
  "diseaseDescription": string,
  "causes": string,
  "conditions": string,
  "impact": string,
  "chemicalControl": string,
  "culturalTreatment": string,
  "drainageSolutions": string,
  "organicProtection": string
}

Guidelines for your response:

1. DISEASE IDENTIFIED
- diseaseName: Use the common name farmers know
- diseaseDescription: 1-2 short sentences describing what it looks like on the plant
- If healthy, set isHealthy=true, diseaseName="Healthy Plant", and brief positive message

2. CAUSES
- causes: List the main cause clearly (fungus, bacteria, virus, or pest with scientific name in parentheses)
- Example: "Fungus (Phytophthora infestans)" or "Bacterial infection (Xanthomonas)"

3. CONDITIONS THAT TRIGGER IT
- conditions: List 3-5 environmental/field conditions as bullet points
- Use simple terms: high humidity, warm temperatures, poor airflow, overcrowded plants, poor drainage, continuous same crop

4. WHY IT'S HARMFUL
- impact: Explain in 3-4 short bullet points:
  * How it affects plant health
  * How it reduces yield
  * Typical yield loss (e.g., "10-50% if untreated")
  * Long-term effects if any (soil residue, spreading, seed infection)

5. TREATMENT & CONTROL (4 categories)

A. chemicalControl:
- Recommend 2-3 effective chemicals (include brand names if known)
- Simple timing: "Spray at first symptoms, repeat after 14 days"
- Mention rotation to avoid resistance
- Keep it short and direct

B. culturalTreatment:
- List 4-5 practical field actions:
  * Crop rotation schedule
  * Plant spacing for airflow
  * Remove/bury infected plants
  * Use resistant varieties
  * Control weeds

C. drainageSolutions:
- Give 3-4 simple field fixes:
  * Improve water flow direction
  * Break compacted soil
  * Create shallow drainage channels
  * Avoid water pooling

D. organicProtection:
- List 3-4 safe organic options:
  * Neem oil/extract application
  * Copper-based sprays
  * Beneficial microbes (Trichoderma)
  * Other organic methods

TONE REQUIREMENTS:
- Use simple language a farmer can understand immediately
- Short sentences, no jargon unless necessary
- Be direct and practical - focus on actions they can take today
- Write like you're advising a farmer in the field, not writing a textbook
- Each section should be clear bullet points or short paragraphs`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze this plant image and identify any diseases or health issues.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "disease_diagnosis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            isHealthy: {
              type: "boolean",
              description: "Whether the plant is healthy or diseased",
            },
            diseaseName: {
              type: "string",
              description: "Common name of the disease that farmers recognize",
            },
            confidence: {
              type: "number",
              description: "Confidence score from 0 to 100",
            },
            diseaseDescription: {
              type: "string",
              description: "Short description of what the disease looks like (1-2 sentences)",
            },
            causes: {
              type: "string",
              description: "Main cause of the disease (fungus, bacteria, virus, or pest with scientific name)",
            },
            conditions: {
              type: "string",
              description: "Environmental or field conditions that trigger the disease (bullet points)",
            },
            impact: {
              type: "string",
              description: "Why it's harmful - effects on plant health, yield loss, and long-term impact (bullet points)",
            },
            chemicalControl: {
              type: "string",
              description: "Chemical treatment options with timing and rotation advice",
            },
            culturalTreatment: {
              type: "string",
              description: "Practical field actions like crop rotation, spacing, and resistant varieties",
            },
            drainageSolutions: {
              type: "string",
              description: "Simple drainage and water management fixes",
            },
            organicProtection: {
              type: "string",
              description: "Organic and biological treatment options",
            },
          },
          required: [
            "isHealthy",
            "diseaseName",
            "confidence",
            "diseaseDescription",
            "causes",
            "conditions",
            "impact",
            "chemicalControl",
            "culturalTreatment",
            "drainageSolutions",
            "organicProtection"
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const messageContent = response.choices[0].message.content;
  return JSON.parse(typeof messageContent === 'string' ? messageContent : "{}");
}

export const detectionRouter = router({
  // Analyze a single plant image
  analyze: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Extract base64 data and content type
      const matches = input.imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid base64 image format");
      }

      const contentType = matches[1];
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Upload image to S3
      const fileKey = `detections/${userId}/${nanoid()}.${contentType.split("/")[1]}`;
      const { url: imageUrl } = await storagePut(fileKey, imageBuffer, contentType);

      // Create initial detection record
      const insertResult = await createDetection({
        userId,
        imageUrl,
        imageKey: fileKey,
        status: "pending",
      });

      const detectionId = (insertResult as any)[0]?.insertId;

      if (!detectionId || typeof detectionId !== 'number') {
        throw new Error("Failed to create detection record");
      }

      // Analyze with AI
      try {
        const result = await analyzeImage(imageUrl);

        // Determine confidence level
        let confidenceLevel: "high" | "medium" | "low" | "uncertain" = "uncertain";
        if (result.confidence >= 80) {
          confidenceLevel = "high";
        } else if (result.confidence >= 50) {
          confidenceLevel = "medium";
        } else if (result.confidence >= 30) {
          confidenceLevel = "low";
        }

        // Update detection with results
        await updateDetection(detectionId, {
          diseaseName: result.diseaseName,
          confidence: Math.round(result.confidence),
          confidenceLevel,
          description: result.diseaseDescription,
          treatments: JSON.stringify({
            causes: result.causes,
            conditions: result.conditions,
            impact: result.impact,
            chemicalControl: result.chemicalControl,
            culturalTreatment: result.culturalTreatment,
            drainageSolutions: result.drainageSolutions,
            organicProtection: result.organicProtection,
          }),
          status: confidenceLevel === "high" ? "completed" : "needs_verification",
          metadata: JSON.stringify({
            isHealthy: result.isHealthy,
            analyzedAt: new Date().toISOString(),
          }),
        });

        return {
          detectionId,
          success: true,
          confidenceLevel,
          needsMoreImages: needsMoreImages(result.confidence, confidenceLevel, 1),
        };
      } catch (error) {
        // Mark as failed
        await updateDetection(detectionId, {
          status: "failed",
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        });
        throw new Error("Failed to analyze image. Please try again.");
      }
    }),

  // Add additional image for multi-image verification
  addVerificationImage: protectedProcedure
    .input(
      z.object({
        detectionId: z.number(),
        imageBase64: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify detection belongs to user
      const detection = await getDetectionById(input.detectionId);
      if (!detection || detection.userId !== userId) {
        throw new Error("Unauthorized");
      }

      // Extract base64 data
      const matches = input.imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid base64 image format");
      }

      const contentType = matches[1];
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Upload image to S3
      const fileKey = `detections/${userId}/${nanoid()}.${contentType.split("/")[1]}`;
      const { url: imageUrl } = await storagePut(fileKey, imageBuffer, contentType);

      // Get existing images count
      const existingImages = await getDetectionImages(input.detectionId);
      const imageOrder = existingImages.length + 1;

      // Create detection image record
      const insertResult = await createDetectionImage({
        detectionId: input.detectionId,
        imageUrl,
        imageKey: fileKey,
        imageOrder,
      });

      // Analyze the new image
      try {
        const analysis = await analyzeImage(imageUrl);

        // Store individual analysis
        await createDetectionImage({
          detectionId: input.detectionId,
          imageUrl,
          imageKey: fileKey,
          analysisResult: JSON.stringify(analysis),
          imageOrder,
        });

        // Get all images and analyses
        const allImages = await getDetectionImages(input.detectionId);

        // Perform ensemble analysis if we have multiple analyses
        if (allImages.length >= 2) {
          const analyses = allImages
            .filter(img => img.analysisResult)
            .map(img => JSON.parse(img.analysisResult || "{}"));

          if (analyses.length >= 2) {
            const ensembleResult = performEnsembleAnalysis(analyses);

            // Update detection with ensemble results
            await updateDetection(input.detectionId, {
              diseaseName: ensembleResult.finalDiseaseName,
              confidence: ensembleResult.finalConfidence,
              confidenceLevel: ensembleResult.confidenceLevel,
              status: ensembleResult.confidenceLevel === "high" ? "completed" : "needs_verification",
              ensembleAnalysis: JSON.stringify(ensembleResult),
            });

            return {
              success: true,
              ensembleResult,
              needsMoreImages: needsMoreImages(
                ensembleResult.finalConfidence,
                ensembleResult.confidenceLevel,
                allImages.length
              ),
            };
          }
        }

        return {
          success: true,
          imageAdded: true,
          needsMoreImages: true,
        };
      } catch (error) {
        throw new Error("Failed to analyze additional image. Please try again.");
      }
    }),

  // Get detection by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const detection = await getDetectionById(input.id);

      if (!detection) {
        throw new Error("Detection not found");
      }

      // Ensure user can only access their own detections
      if (detection.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      // Get all images if ensemble analysis exists
      let images = null;
      if (detection.ensembleAnalysis) {
        images = await getDetectionImages(input.id);
      }

      return {
        ...detection,
        images,
      };
    }),

  // Get user's detection history
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return await getUserDetections(ctx.user.id);
  }),
});
0

