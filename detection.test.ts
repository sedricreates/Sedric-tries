import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { createDetection, getDetectionById, getUserDetections } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("detection.getHistory", () => {
  it("returns empty array when user has no detections", async () => {
    const ctx = createAuthContext(999); // User with no detections
    const caller = appRouter.createCaller(ctx);

    const history = await caller.detection.getHistory();

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBe(0);
  });

  it("returns user's detection history ordered by date", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create test detections
    await createDetection({
      userId: 1,
      imageUrl: "https://example.com/image1.jpg",
      imageKey: "test/image1.jpg",
      diseaseName: "Test Disease 1",
      confidence: 85,
      status: "completed",
    });

    await createDetection({
      userId: 1,
      imageUrl: "https://example.com/image2.jpg",
      imageKey: "test/image2.jpg",
      diseaseName: "Healthy",
      confidence: 95,
      status: "completed",
    });

    const history = await caller.detection.getHistory();

    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history[0].userId).toBe(1);
    // Most recent should be first
    expect(new Date(history[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(history[1].createdAt).getTime()
    );
  });
});

describe("detection.getById", () => {
  it("returns detection when user owns it", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create a test detection
    const insertResult = await createDetection({
      userId: 1,
      imageUrl: "https://example.com/test.jpg",
      imageKey: "test/test.jpg",
      diseaseName: "Test Disease",
      confidence: 90,
      description: "Test description",
      treatments: "Test treatments",
      status: "completed",
    });

    const detectionId = (insertResult as any)[0]?.insertId;

    const detection = await caller.detection.getById({ id: detectionId });

    expect(detection).toBeDefined();
    expect(detection?.id).toBe(detectionId);
    expect(detection?.userId).toBe(1);
    expect(detection?.diseaseName).toBe("Test Disease");
    expect(detection?.confidence).toBe(90);
  });

  it("throws error when detection not found", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.detection.getById({ id: 999999 })
    ).rejects.toThrow("Detection not found");
  });

  it("throws error when user tries to access another user's detection", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // Create detection for user 1
    const insertResult = await createDetection({
      userId: 1,
      imageUrl: "https://example.com/user1.jpg",
      imageKey: "test/user1.jpg",
      status: "completed",
    });

    const detectionId = (insertResult as any)[0]?.insertId;

    // Try to access with user 2
    const ctx2 = createAuthContext(2);
    const caller2 = appRouter.createCaller(ctx2);

    await expect(
      caller2.detection.getById({ id: detectionId })
    ).rejects.toThrow("Unauthorized");
  });

  it("allows admin to access any detection", async () => {
    const ctx1 = createAuthContext(1);
    const caller1 = appRouter.createCaller(ctx1);

    // Create detection for user 1
    const insertResult = await createDetection({
      userId: 1,
      imageUrl: "https://example.com/user1.jpg",
      imageKey: "test/user1.jpg",
      status: "completed",
    });

    const detectionId = (insertResult as any)[0]?.insertId;

    // Access with admin user
    const adminCtx = createAuthContext(999, "admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    const detection = await adminCaller.detection.getById({ id: detectionId });

    expect(detection).toBeDefined();
    expect(detection?.id).toBe(detectionId);
  });
});

describe("detection.analyze", () => {
  it("rejects invalid base64 format", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.detection.analyze({ imageBase64: "invalid-base64" })
    ).rejects.toThrow("Invalid base64 image format");
  });

  it("accepts valid base64 image and creates detection record", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Create a small test image (1x1 red pixel PNG)
    const testImageBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

    // Note: This will actually call the LLM API
    const result = await caller.detection.analyze({ imageBase64: testImageBase64 });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.detectionId).toBeGreaterThan(0);

    // Verify the detection was created
    const detection = await getDetectionById(result.detectionId);
    expect(detection).toBeDefined();
    expect(detection?.userId).toBe(1);
    // Status can be either 'completed' (high confidence) or 'needs_verification' (medium/low confidence)
    expect(["completed", "needs_verification"]).toContain(detection?.status);
    expect(detection?.imageUrl).toBeDefined();
  }, 30000); // 30 second timeout for LLM API call
});
0

