const SKILL_ALIASES: Record<string, string> = {
  "node": "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  "react": "React",
  "reactjs": "React",
  "react.js": "React",
  "js": "JavaScript",
  "javascript": "JavaScript",
  "ts": "TypeScript",
  "typescript": "TypeScript",
  "py": "Python",
  "python": "Python",
  "postgres": "PostgreSQL",
  "postgresql": "PostgreSQL",
  "mongo": "MongoDB",
  "mongodb": "MongoDB",
  "aws": "AWS",
  "amazon web services": "AWS",
  "gcp": "GCP",
  "google cloud": "GCP",
  "azure": "Azure",
  "microsoft azure": "Azure",
  "docker": "Docker",
  "kubernetes": "Kubernetes",
  "k8s": "Kubernetes",
  "ml": "Machine Learning",
  "machine learning": "Machine Learning",
  "ai": "Artificial Intelligence",
  "rest": "REST API",
  "restful": "REST API",
  "graphql": "GraphQL",
  "sql": "SQL",
  "nosql": "NoSQL",
  "ci/cd": "CI/CD",
  "cicd": "CI/CD",
  "devops": "DevOps",
  "swift": "Swift",
  "swiftui": "SwiftUI",
  "solidity": "Solidity",
  "blockchain": "Blockchain",
  "selenium": "Selenium",
  "playwright": "Playwright",
  "spark": "Apache Spark",
  "kafka": "Apache Kafka",
};

export function skillNormalizationTool(skills: string[]): string[] {
  return skills.map((skill) => {
    const lower = skill.toLowerCase().trim();
    return SKILL_ALIASES[lower] || skill;
  });
}

export function extractSkillsFromText(text: string): string[] {
  const knownSkills = Object.keys(SKILL_ALIASES).concat(
    Object.values(SKILL_ALIASES)
  );

  const found = new Set<string>();
  const lowerText = text.toLowerCase();

  for (const skill of knownSkills) {
    if (lowerText.includes(skill.toLowerCase())) {
      found.add(SKILL_ALIASES[skill.toLowerCase()] || skill);
    }
  }

  return Array.from(found);
}