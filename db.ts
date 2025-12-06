import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, detections, InsertDetection, detectionImages, InsertDetectionImage, symptomVerifications, InsertSymptomVerification, agroCompanies, InsertAgroCompany, companyAnalytics, InsertCompanyAnalytics } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Detection query helpers
export async function createDetection(detection: InsertDetection) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(detections).values(detection);
  return result;
}

export async function updateDetection(id: number, updates: Partial<InsertDetection>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(detections).set(updates).where(eq(detections.id, id));
}

export async function getDetectionById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(detections).where(eq(detections.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserDetections(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(detections)
    .where(eq(detections.userId, userId))
    .orderBy(desc(detections.createdAt));
}

export async function createDetectionImage(data: InsertDetectionImage) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.insert(detectionImages).values(data);
}

export async function getDetectionImages(detectionId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(detectionImages)
    .where(eq(detectionImages.detectionId, detectionId))
    .orderBy(detectionImages.imageOrder);
}

export async function updateDetectionEnsemble(
  detectionId: number,
  ensembleData: any
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(detections)
    .set({
      ensembleAnalysis: JSON.stringify(ensembleData),
    })
    .where(eq(detections.id, detectionId));
}

// Symptom verification helpers
export async function createSymptomVerification(data: InsertSymptomVerification) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.insert(symptomVerifications).values(data);
}

export async function getSymptomVerification(detectionId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select()
    .from(symptomVerifications)
    .where(eq(symptomVerifications.detectionId, detectionId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// Agro company helpers
export async function createAgroCompany(data: InsertAgroCompany) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.insert(agroCompanies).values(data);
}

export async function getAgroCompanies() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.select().from(agroCompanies).orderBy(desc(agroCompanies.createdAt));
}

export async function getAgroCompanyById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(agroCompanies).where(eq(agroCompanies.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAgroCompany(id: number, updates: Partial<InsertAgroCompany>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(agroCompanies).set(updates).where(eq(agroCompanies.id, id));
}

// Company analytics helpers
export async function getCompanyAnalytics(companyId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(companyAnalytics)
    .where(eq(companyAnalytics.companyId, companyId))
    .orderBy(desc(companyAnalytics.recordDate));
}

export async function createCompanyAnalytics(data: InsertCompanyAnalytics) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.insert(companyAnalytics).values(data);
}
0

