import prisma from "../../config/prisma/prisma.js";
import { runRecommendationAgent } from "./agentOrchestrator.js";
import { logger } from "../../utils/logger.js";

function inferRequiredSkills(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const skillMap: Record<string, string[]> = {
    react: ["React", "JavaScript", "TypeScript", "HTML", "CSS"],
    node: ["Node.js", "JavaScript", "TypeScript", "REST API"],
    devops: ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
    python: ["Python", "Machine Learning", "SQL"],
    "ml engineer": ["Python", "Machine Learning", "TensorFlow", "PyTorch"],
    qa: ["Selenium", "Playwright", "Testing", "Automation"],
    cloud: ["AWS", "Azure", "GCP", "Kubernetes", "Docker"],
    data: ["SQL", "Apache Spark", "Apache Kafka", "Python"],
    ios: ["Swift", "SwiftUI", "Xcode", "iOS"],
    blockchain: ["Solidity", "Blockchain", "Ethereum", "Web3"],
    "ui/ux": ["Figma", "Design", "Prototyping", "CSS"],
    manager: ["Project Management", "Agile", "Scrum", "Leadership"],
    security: ["Cybersecurity", "SIEM", "Penetration Testing", "Networking"],
  };

  const skills = new Set<string>();
  for (const [keyword, relatedSkills] of Object.entries(skillMap)) {
    if (text.includes(keyword)) {
      relatedSkills.forEach((s) => skills.add(s));
    }
  }

  return skills.size > 0 ? Array.from(skills) : ["Communication", "Teamwork"];
}

export async function processProfileRecommendation(
  profileId: number
): Promise<void> {
  logger.info("recommendation_start", { profileId });

  const profile = await prisma.hiringProfile.findUnique({
    where: { id: profileId },
    include: { opening: true },
  });

  if (!profile || profile.isDeleted) {
    logger.info("recommendation_skip", { profileId, reason: "not found or deleted" });
    return;
  }

  if (profile.recommended !== null) {
    logger.info("recommendation_skip", { profileId, reason: "already processed" });
    return;
  }

  const requiredSkills = inferRequiredSkills(
    profile.opening.title,
    profile.opening.description || ""
  );

  try {
    const agentOutput = await runRecommendationAgent({
      s3Key: profile.s3Key,
      openingTitle: profile.opening.title,
      openingDescription: profile.opening.description || "",
      requiredSkills,
      experienceMin: profile.opening.experienceMin,
      experienceMax: profile.opening.experienceMax,
      jobLocation: profile.opening.location || "Remote",
    });

    await prisma.$transaction([
      prisma.hiringProfile.update({
        where: { id: profileId },
        data: {
          recommended: agentOutput.recommended,
          recommendationScore: agentOutput.score,
          recommendationReason: agentOutput.reason,
          recommendationLatencyMs: agentOutput.latencyMs,
          recommendationVersion: agentOutput.version,
          recommendationConfidence: agentOutput.confidence,
          recommendedAt: new Date(),
        },
      }),
    ]);

    logger.info("recommendation_complete", {
      profileId,
      score: agentOutput.score,
      recommended: agentOutput.recommended,
      latencyMs: agentOutput.latencyMs,
    });
  } catch (error) {
    logger.error("recommendation_failed", error, { profileId });
  }
}

export async function processProfilesAsync(profileIds: number[]): Promise<void> {
  setImmediate(async () => {
    for (const id of profileIds) {
      await processProfileRecommendation(id);
    }
  });
}