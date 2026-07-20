import prisma from "../config/prisma/prisma.js";

async function update() {
  const result = await prisma.opening.updateMany({
    where: { hiringManagerId: "placeholder" },
    data: { hiringManagerId: "241056e4-81a6-4051-b4a6-d51a158fcc4d" },
  });
  console.log(`✅ Updated ${result.count} openings`);
  await prisma.$disconnect();
}

update();