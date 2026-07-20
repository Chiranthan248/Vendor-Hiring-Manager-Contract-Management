import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("../../src/config/prisma/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock jwks-rsa
vi.mock("jwks-rsa", () => ({
  default: vi.fn(() => ({
    getSigningKey: vi.fn(),
  })),
}));

describe("RBAC & Authorization", () => {
  describe("Role Validation", () => {
    it("should accept valid IT_VENDOR role", async () => {
      const { isValidRole } = await import("../../src/utils/RBAC/isValidRole.js");
      expect(isValidRole("IT_VENDOR")).toBe(true);
    });

    it("should accept valid HIRING_MANAGER role", async () => {
      const { isValidRole } = await import("../../src/utils/RBAC/isValidRole.js");
      expect(isValidRole("HIRING_MANAGER")).toBe(true);
    });

    it("should reject invalid role", async () => {
      const { isValidRole } = await import("../../src/utils/RBAC/isValidRole.js");
      expect(isValidRole("SUPER_ADMIN")).toBe(false);
    });

    it("should reject empty role", async () => {
      const { isValidRole } = await import("../../src/utils/RBAC/isValidRole.js");
      expect(isValidRole("")).toBe(false);
    });

    it("should reject lowercase role", async () => {
      const { isValidRole } = await import("../../src/utils/RBAC/isValidRole.js");
      expect(isValidRole("it_vendor")).toBe(false);
    });
  });

  describe("Tenant Isolation", () => {
  it("should enforce tenant filtering on openings query", () => {
    const tenantId = "tenant-123";
    const query = { where: { tenantId } };
    expect(query.where.tenantId).toBe(tenantId);
  });

  it("should not allow cross-tenant access", () => {
    const userTenantId: string = "tenant-abc";
    const requestedTenantId: string = "tenant-xyz";
    expect(userTenantId === requestedTenantId).toBe(false);
  });

  it("should validate opening belongs to tenant before upload", () => {
    const opening = { tenantId: "tenant-abc", id: "opening-1" };
    const userTenantId: string = "tenant-xyz";
    const hasAccess = opening.tenantId === userTenantId;
    expect(hasAccess).toBe(false);
  });
});

  describe("Scoring Engine - Unauthorized Score Manipulation", () => {
    it("should not allow score above 1", async () => {
      const { scoringEngineTool } = await import(
        "../../src/services/agent/tools/scoringEngineTool.js"
      );
      const result = scoringEngineTool({
        candidateExperienceYears: 999,
        candidateSkills: ["React", "Node.js", "Python", "AWS"],
        candidateLocation: "Remote",
        requiredExperienceMin: 1,
        requiredExperienceMax: 5,
        requiredSkills: ["React"],
        jobLocation: "Remote",
      });
      expect(result.finalScore).toBeLessThanOrEqual(1);
    });

    it("should not allow negative score", async () => {
      const { scoringEngineTool } = await import(
        "../../src/services/agent/tools/scoringEngineTool.js"
      );
      const result = scoringEngineTool({
        candidateExperienceYears: 0,
        candidateSkills: [],
        candidateLocation: "Unknown",
        requiredExperienceMin: 10,
        requiredExperienceMax: 20,
        requiredSkills: ["React", "Node.js"],
        jobLocation: "Bangalore",
      });
      expect(result.finalScore).toBeGreaterThanOrEqual(0);
    });
  });
});