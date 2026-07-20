export interface ScoringInput {
  candidateExperienceYears: number;
  candidateSkills: string[];
  candidateLocation: string;
  requiredExperienceMin: number;
  requiredExperienceMax: number | null;
  requiredSkills: string[];
  jobLocation: string;
}

export interface ScoringOutput {
  skillMatchScore: number;
  experienceMatchScore: number;
  locationMatchScore: number;
  finalScore: number;
  breakdown: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceStatus: string;
  };
}

export function scoringEngineTool(input: ScoringInput): ScoringOutput {
  // Experience scoring
  let experienceMatchScore = 0;
  let experienceStatus = "";

  if (input.candidateExperienceYears < input.requiredExperienceMin) {
    experienceMatchScore = 0;
    experienceStatus = `Under-qualified: ${input.candidateExperienceYears}yrs < ${input.requiredExperienceMin}yrs required`;
  } else if (
    input.requiredExperienceMax &&
    input.candidateExperienceYears > input.requiredExperienceMax
  ) {
    experienceMatchScore = 0.8;
    experienceStatus = `Over-qualified: ${input.candidateExperienceYears}yrs > ${input.requiredExperienceMax}yrs max`;
  } else {
    experienceMatchScore = 1;
    experienceStatus = `Within range: ${input.candidateExperienceYears}yrs`;
  }

  // Skill matching
  const normalizedCandidateSkills = input.candidateSkills.map((s) =>
    s.toLowerCase()
  );
  const normalizedRequiredSkills = input.requiredSkills.map((s) =>
    s.toLowerCase()
  );

  const matchedSkills = input.requiredSkills.filter((skill) =>
    normalizedCandidateSkills.includes(skill.toLowerCase())
  );
  const missingSkills = input.requiredSkills.filter(
    (skill) => !normalizedCandidateSkills.includes(skill.toLowerCase())
  );

  const skillMatchScore =
    normalizedRequiredSkills.length > 0
      ? matchedSkills.length / normalizedRequiredSkills.length
      : 0.5;

  // Location matching
  let locationMatchScore = 0;
  const candidateLoc = input.candidateLocation.toLowerCase();
  const jobLoc = input.jobLocation.toLowerCase();

  if (jobLoc === "remote") {
    locationMatchScore = 1;
  } else if (candidateLoc === jobLoc) {
    locationMatchScore = 1;
  } else {
    locationMatchScore = 0.5;
  }

  // Final score formula (MANDATORY from spec)
  const finalScore =
    0.5 * skillMatchScore +
    0.3 * experienceMatchScore +
    0.2 * locationMatchScore;

  return {
    skillMatchScore: Math.round(skillMatchScore * 100) / 100,
    experienceMatchScore: Math.round(experienceMatchScore * 100) / 100,
    locationMatchScore: Math.round(locationMatchScore * 100) / 100,
    finalScore: Math.round(finalScore * 100) / 100,
    breakdown: {
      matchedSkills,
      missingSkills,
      experienceStatus,
    },
  };
}