import prisma from "../config/prisma/prisma.js";

async function update() {
  const result = await prisma.opening.updateMany({
    where: { hiringManagerId: "241056e4-81a6-4051-b4a6-d51a158fcc4d" },
    data: { hiringManagerId: "249d4a3e-e7e3-4045-a84f-ec957ab5364c" },
  });
  console.log(`✅ Updated ${result.count} openings`);
  await prisma.$disconnect();
}

update();