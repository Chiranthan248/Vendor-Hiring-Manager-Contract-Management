import { describe, it, expect } from "vitest";
import { scoringEngineTool } from "../../src/services/agent/tools/scoringEngineTool.js";

describe("Scoring Engine", () => {
  // Experience boundary tests
  describe("Experience Logic", () => {
    it("should return 0 when candidate experience is below minimum", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 1,
        candidateSkills: ["React"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React"],
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(0);
    });

    it("should return 1 when candidate experience is within range", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React"],
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(1);
    });

    it("should return 0.8 when candidate experience is above maximum", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 10,
        candidateSkills: ["React"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React"],
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(0.8);
    });

    it("should return 1 when no max experience and candidate meets minimum", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 5,
        candidateSkills: ["React"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: null,
        requiredSkills: ["React"],
        jobLocation: "Remote",
      });
      expect(result.experienceMatchScore).toBe(1);
    });
  });

  // Skill overlap tests
  describe("Skill Match Logic", () => {
    it("should return 1 when all skills match", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React", "TypeScript", "Node.js"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React", "TypeScript", "Node.js"],
        jobLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(1);
    });

    it("should return 0.5 when half of skills match", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React", "CSS"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React", "TypeScript", "Node.js", "CSS"],
        jobLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(0.5);
    });

    it("should return 0 when no skills match", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["Python", "Django"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React", "TypeScript", "Node.js"],
        jobLocation: "Remote",
      });
      expect(result.skillMatchScore).toBe(0);
    });
  });

  // Location tests
  describe("Location Match Logic", () => {
    it("should return 1 for remote jobs", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React"],
        candidateLocation: "Bangalore",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React"],
        jobLocation: "Remote",
      });
      expect(result.locationMatchScore).toBe(1);
    });

    it("should return 1 for exact location match", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React"],
        candidateLocation: "bangalore",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React"],
        jobLocation: "bangalore",
      });
      expect(result.locationMatchScore).toBe(1);
    });

    it("should return 0.5 for location mismatch", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React"],
        candidateLocation: "Mumbai",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React"],
        jobLocation: "Bangalore",
      });
      expect(result.locationMatchScore).toBe(0.5);
    });
  });

  // Final score formula tests
  describe("Final Score Formula", () => {
    it("should calculate correct final score", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React", "TypeScript"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React", "TypeScript"],
        jobLocation: "Remote",
      });
      // 0.5 * 1 + 0.3 * 1 + 0.2 * 1 = 1.0
      expect(result.finalScore).toBe(1);
    });

    it("should recommend when score >= 0.75", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React", "TypeScript", "Node.js"],
        candidateLocation: "Bangalore",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React", "TypeScript", "Node.js", "CSS"],
        jobLocation: "Mumbai",
      });
      // skillMatch: 3/4 = 0.75, expMatch: 1, locationMatch: 0.5
      // 0.5*0.75 + 0.3*1 + 0.2*0.5 = 0.375 + 0.3 + 0.1 = 0.775
      expect(result.finalScore).toBeGreaterThanOrEqual(0.75);
    });
  });

  // RBAC / unauthorized access tests
  describe("Score Breakdown", () => {
    it("should return matched and missing skills in breakdown", () => {
      const result = scoringEngineTool({
        candidateExperienceYears: 4,
        candidateSkills: ["React", "CSS"],
        candidateLocation: "Remote",
        requiredExperienceMin: 3,
        requiredExperienceMax: 6,
        requiredSkills: ["React", "TypeScript", "Node.js", "CSS"],
        jobLocation: "Remote",
      });
      expect(result.breakdown.matchedSkills).toContain("React");
      expect(result.breakdown.matchedSkills).toContain("CSS");
      expect(result.breakdown.missingSkills).toContain("TypeScript");
      expect(result.breakdown.missingSkills).toContain("Node.js");
    });
  });
});