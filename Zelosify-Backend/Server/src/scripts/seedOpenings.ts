import prisma from "../config/prisma/prisma.js";

const TENANT_ID = "a4689416-f283-4d51-9a3c-846ec53bd0b1";

async function seedOpenings() {
  try {
    console.log("🌱 Seeding openings data...");

    const openings = [
      { title: "Senior React Developer", description: "Build scalable frontend applications using React and TypeScript.", location: "Bangalore", contractType: "Full-Time", hiringManagerId: "placeholder", experienceMin: 4, experienceMax: 8, status: "OPEN" as const },
      { title: "Node.js Backend Engineer", description: "Design and implement RESTful APIs using Node.js and Express.", location: "Remote", contractType: "Contract", hiringManagerId: "placeholder", experienceMin: 3, experienceMax: 6, status: "OPEN" as const },
      { title: "DevOps Engineer", description: "Manage CI/CD pipelines, Docker, Kubernetes infrastructure.", location: "Mumbai", contractType: "Full-Time", hiringManagerId: "placeholder", experienceMin: 5, experienceMax: 10, status: "OPEN" as const },
      { title: "Python ML Engineer", description: "Develop and deploy machine learning models for production.", location: "Remote", contractType: "Contract", hiringManagerId: "placeholder", experienceMin: 3, experienceMax: 7, status: "OPEN" as const },
      { title: "QA Automation Engineer", description: "Write automated test suites using Selenium and Playwright.", location: "Hyderabad", contractType: "Part-Time", hiringManagerId: "placeholder", experienceMin: 2, experienceMax: 5, status: "OPEN" as const },
      { title: "Cloud Architect", description: "Design multi-cloud architecture on AWS and Azure.", location: "Bangalore", contractType: "Full-Time", hiringManagerId: "placeholder", experienceMin: 8, experienceMax: 15, status: "OPEN" as const },
      { title: "Data Engineer", description: "Build and maintain data pipelines using Spark and Kafka.", location: "Remote", contractType: "Contract", hiringManagerId: "placeholder", experienceMin: 3, experienceMax: 6, status: "OPEN" as const },
      { title: "iOS Developer", description: "Build native iOS apps using Swift and SwiftUI.", location: "Pune", contractType: "Full-Time", hiringManagerId: "placeholder", experienceMin: 2, experienceMax: 5, status: "OPEN" as const },
      { title: "Cybersecurity Analyst", description: "Monitor and respond to security incidents and vulnerabilities.", location: "Delhi", contractType: "Full-Time", hiringManagerId: "placeholder", experienceMin: 4, experienceMax: 8, status: "ON_HOLD" as const },
      { title: "UI/UX Designer", description: "Design intuitive user interfaces and conduct usability testing.", location: "Remote", contractType: "Contract", hiringManagerId: "placeholder", experienceMin: 2, experienceMax: 6, status: "OPEN" as const },
      { title: "Blockchain Developer", description: "Develop smart contracts and DeFi applications on Ethereum.", location: "Bangalore", contractType: "Contract", hiringManagerId: "placeholder", experienceMin: 3, experienceMax: 7, status: "OPEN" as const },
      { title: "Technical Project Manager", description: "Lead cross-functional engineering teams and manage delivery.", location: "Mumbai", contractType: "Full-Time", hiringManagerId: "placeholder", experienceMin: 6, experienceMax: 12, status: "CLOSED" as const },
    ];

    for (const opening of openings) {
      await prisma.opening.create({
        data: { ...opening, tenantId: TENANT_ID },
      });
    }

    console.log(`✅ Seeded ${openings.length} openings for Bruce Wayne Corp`);
  } catch (error) {
    console.error("❌ Error seeding openings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOpenings();