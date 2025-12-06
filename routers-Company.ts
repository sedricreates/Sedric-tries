import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createSymptomVerification,
  getSymptomVerification,
  createAgroCompany,
  getAgroCompanies,
  getAgroCompanyById,
  updateAgroCompany,
  getCompanyAnalytics,
  createCompanyAnalytics,
} from "./db";

export const companyRouter = router({
  // Symptom verification procedures
  submitVerification: protectedProcedure
    .input(
      z.object({
        detectionId: z.number(),
        answers: z.record(z.string(), z.boolean()),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await createSymptomVerification({
          detectionId: input.detectionId,
          answers: JSON.stringify(input.answers),
          confirmed: Object.values(input.answers).filter(Boolean).length > 0 ? 1 : 0,
          notes: input.notes || null,
        });

        return {
          success: true,
          message: "Symptom verification submitted successfully",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to submit verification"
        );
      }
    }),

  getVerification: publicProcedure
    .input(z.object({ detectionId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getSymptomVerification(input.detectionId);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch verification"
        );
      }
    }),

  // Company management procedures
  getAll: publicProcedure.query(async () => {
    try {
      return await getAgroCompanies();
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch companies"
      );
    }
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getAgroCompanyById(input.id);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch company"
        );
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        specializations: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can create companies
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can create companies");
      }

      try {
        const result = await createAgroCompany({
          name: input.name,
          email: input.email,
          contactPerson: input.contactPerson || null,
          phone: input.phone || null,
          website: input.website || null,
          description: input.description || null,
          specializations: input.specializations
            ? JSON.stringify(input.specializations)
            : null,
          adminUserId: ctx.user.id,
          verified: 0,
        });

        return {
          success: true,
          message: "Company created successfully",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to create company"
        );
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        contactPerson: z.string().optional(),
        phone: z.string().optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        specializations: z.array(z.string()).optional(),
        verified: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can update companies
      if (ctx.user?.role !== "admin") {
        throw new Error("Unauthorized: Only admins can update companies");
      }

      try {
        const updates: Record<string, unknown> = {};

        if (input.name !== undefined) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email;
        if (input.contactPerson !== undefined) updates.contactPerson = input.contactPerson;
        if (input.phone !== undefined) updates.phone = input.phone;
        if (input.website !== undefined) updates.website = input.website;
        if (input.description !== undefined) updates.description = input.description;
        if (input.specializations !== undefined) {
          updates.specializations = JSON.stringify(input.specializations);
        }
        if (input.verified !== undefined) updates.verified = input.verified;

        await updateAgroCompany(input.id, updates as any);

        return {
          success: true,
          message: "Company updated successfully",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to update company"
        );
      }
    }),

  // Company analytics procedures
  getAnalytics: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      try {
        return await getCompanyAnalytics(input.companyId);
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to fetch analytics"
        );
      }
    }),

  recordAnalytics: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        diseaseName: z.string(),
        detectionCount: z.number(),
        farmerCount: z.number(),
        region: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await createCompanyAnalytics({
          companyId: input.companyId,
          diseaseName: input.diseaseName,
          detectionCount: input.detectionCount,
          farmerCount: input.farmerCount,
          region: input.region || null,
        });

        return {
          success: true,
          message: "Analytics recorded successfully",
        };
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to record analytics"
        );
      }
    }),
});

export type CompanyRouter = typeof companyRouter;
0

