import prisma from "../../config/prisma/prisma.js";

export async function getOpeningsByTenant(
  tenantId: string,
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;

  const [openings, total] = await Promise.all([
    prisma.opening.findMany({
      where: { tenantId },
      skip,
      take: limit,
      orderBy: { postedDate: "desc" },
      include: {
        _count: { select: { hiringProfiles: { where: { isDeleted: false } } } },
      },
    }),
    prisma.opening.count({ where: { tenantId } }),
  ]);

  return { openings, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getOpeningById(id: string, tenantId: string) {
  const opening = await prisma.opening.findFirst({
    where: { id, tenantId },
    include: {
      _count: { select: { hiringProfiles: { where: { isDeleted: false } } } },
      hiringProfiles: {
        where: { isDeleted: false },
        select: {
          id: true,
          s3Key: true,
          fileName: true,
          uploadedBy: true,
          submittedAt: true,
          status: true,
        },
      },
    },
  });

  if (!opening) return null;

  // Get hiring manager name
  const hiringManager = await prisma.user.findUnique({
    where: { id: opening.hiringManagerId },
    select: { firstName: true, lastName: true, email: true },
  });

  return {
    ...opening,
    hiringManagerName: hiringManager
      ? `${hiringManager.firstName} ${hiringManager.lastName}`
      : "Unknown",
  };
}

export async function getOpeningByIdForManager(
  id: string,
  hiringManagerId: string
) {
  const opening = await prisma.opening.findFirst({
    where: { id, hiringManagerId },
    include: {
      hiringProfiles: {
        where: { isDeleted: false },
        select: {
          id: true,
          s3Key: true,
          fileName: true,
          uploadedBy: true,
          submittedAt: true,
          status: true,
          recommended: true,
          recommendationScore: true,
          recommendationReason: true,
          recommendationConfidence: true,
          recommendationLatencyMs: true,
          recommendationVersion: true,
          recommendedAt: true,
          shortlistedBy: true,
          shortlistedAt: true,
          rejectedBy: true,
          rejectedAt: true,
        },
      },
    },
  });

  if (!opening) return null;

  const hiringManager = await prisma.user.findUnique({
    where: { id: opening.hiringManagerId },
    select: { firstName: true, lastName: true, email: true },
  });

  return {
    ...opening,
    hiringManagerName: hiringManager
      ? `${hiringManager.firstName} ${hiringManager.lastName}`
      : "Unknown",
  };
}

export async function getManagerOpenings(hiringManagerId: string) {
  return prisma.opening.findMany({
    where: { hiringManagerId },
    orderBy: { postedDate: "desc" },
    include: {
      _count: { select: { hiringProfiles: { where: { isDeleted: false } } } },
    },
  });
}