import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Disease detection history table
 * Stores all crop disease detection results with images and AI analysis
 */
export const detections = mysqlTable("detections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** S3 URL of the primary uploaded plant image */
  imageUrl: text("imageUrl").notNull(),
  /** S3 file key for the primary uploaded image */
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  /** Detected disease name */
  diseaseName: varchar("diseaseName", { length: 256 }),
  /** Confidence score from AI model (0-100) */
  confidence: int("confidence"),
  /** Confidence level category: high (>=80%), medium (50-79%), low (<50%), uncertain */
  confidenceLevel: mysqlEnum("confidenceLevel", ["high", "medium", "low", "uncertain"]).default("uncertain"),
  /** Detailed description of the disease */
  description: text("description"),
  /** Treatment recommendations in JSON format */
  treatments: text("treatments"),
  /** Ensemble analysis results from multiple images in JSON format */
  ensembleAnalysis: text("ensembleAnalysis"),
  /** Additional metadata from AI analysis in JSON format */
  metadata: text("metadata"),
  /** Detection status: pending, completed, failed, uncertain, needs_verification */
  status: mysqlEnum("status", ["pending", "completed", "failed", "uncertain", "needs_verification"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Detection = typeof detections.$inferSelect;
export type InsertDetection = typeof detections.$inferInsert;

/**
 * Detection images table for multi-image verification
 * Stores additional images uploaded for ensemble analysis
 */
export const detectionImages = mysqlTable("detectionImages", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the parent detection */
  detectionId: int("detectionId").notNull(),
  /** S3 URL of the image */
  imageUrl: text("imageUrl").notNull(),
  /** S3 file key for the image */
  imageKey: varchar("imageKey", { length: 512 }).notNull(),
  /** Individual analysis result for this image in JSON format */
  analysisResult: text("analysisResult"),
  /** Order in which the image was uploaded (0 = primary) */
  imageOrder: int("imageOrder").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DetectionImage = typeof detectionImages.$inferSelect;
export type InsertDetectionImage = typeof detectionImages.$inferInsert;

/**
 * Symptom verification table
 * Stores farmer confirmation of detected symptoms for accuracy improvement
 */
export const symptomVerifications = mysqlTable("symptomVerifications", {
  id: int("id").autoincrement().primaryKey(),
  detectionId: int("detectionId").notNull(),
  answers: text("answers").notNull(),
  confirmed: int("confirmed").default(0),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SymptomVerification = typeof symptomVerifications.$inferSelect;
export type InsertSymptomVerification = typeof symptomVerifications.$inferInsert;

/**
 * Agro company partnerships table
 */
export const agroCompanies = mysqlTable("agroCompanies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  contactPerson: varchar("contactPerson", { length: 256 }),
  phone: varchar("phone", { length: 20 }),
  website: varchar("website", { length: 512 }),
  description: text("description"),
  specializations: text("specializations"),
  logoUrl: varchar("logoUrl", { length: 512 }),
  verified: int("verified").default(0),
  adminUserId: int("adminUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgroCompany = typeof agroCompanies.$inferSelect;
export type InsertAgroCompany = typeof agroCompanies.$inferInsert;

/**
 * Company analytics table
 */
export const companyAnalytics = mysqlTable("companyAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  diseaseName: varchar("diseaseName", { length: 256 }).notNull(),
  detectionCount: int("detectionCount").default(0),
  farmerCount: int("farmerCount").default(0),
  region: varchar("region", { length: 256 }),
  recordDate: timestamp("recordDate").defaultNow().notNull(),
});

export type CompanyAnalytics = typeof companyAnalytics.$inferSelect;
export type InsertCompanyAnalytics = typeof companyAnalytics.$inferInsert;
0

