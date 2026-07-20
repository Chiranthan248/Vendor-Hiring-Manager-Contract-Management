import { processProfilesAsync } from "../../services/agent/recommendationService.js";
import type { Request, Response } from "express";
import prisma from "../../config/prisma/prisma.js";
import { AwsStorageService } from "../../services/storage/aws/awsStorageService.js";

const storage = new AwsStorageService();

export async function presignUploadURLs(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.tenant?.tenantId) {
      return res.status(403).json({ message: "Tenant not found" });
    }

    const { id: openingId } = req.params;
    const { files } = req.body as { files: { fileName: string }[] };

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ message: "files array is required" });
    }

    const tenantId = user.tenant.tenantId;
    const timestamp = Date.now();

    const presignedUrls = await Promise.all(
      files.map(async ({ fileName }) => {
        const s3Key = `${tenantId}/${openingId}/${timestamp}_${fileName}`;
        const uploadUrl = await storage.getUploadURL(s3Key);
        return { fileName, s3Key, uploadUrl };
      })
    );

    return res.json({ message: "success", data: presignedUrls });
  } catch (err: any) {
    console.error("presignUploadURLs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function submitProfiles(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.tenant?.tenantId) {
      return res.status(403).json({ message: "Tenant not found" });
    }

    const { id: openingId } = req.params;
    const { profiles } = req.body as {
      profiles: { s3Key: string; fileName: string }[];
    };

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return res.status(400).json({ message: "profiles array is required" });
    }

    // Verify opening belongs to tenant
    const opening = await prisma.opening.findFirst({
      where: { id: openingId, tenantId: user.tenant.tenantId },
    });

    if (!opening) {
      return res.status(404).json({ message: "Opening not found" });
    }

    // Use Prisma transaction
    const created = await prisma.$transaction(
      profiles.map(({ s3Key, fileName }) =>
        prisma.hiringProfile.create({
          data: {
            openingId,
            s3Key,
            fileName,
            uploadedBy: user.id,
            status: "SUBMITTED",
          },
        })
      )
    );

  // Fire async recommendation — non-blocking
  const profileIds = created.map((p) => p.id);
  processProfilesAsync(profileIds).catch(console.error);

  return res.status(201).json({
    message: "Profiles submitted successfully",
    data: created,
  });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res
        .status(409)
        .json({ message: "One or more profiles already uploaded" });
    }
    console.error("submitProfiles error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
export async function softDeleteProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: parseInt(id) },
    });

    if (!profile || profile.isDeleted) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.uploadedBy !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await prisma.hiringProfile.update({
      where: { id: parseInt(id) },
      data: { isDeleted: true },
    });

    return res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error("softDeleteProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
export async function getProfilePreviewUrl(req: Request, res: Response) {
  try {
    const { key } = req.query as { key: string };
    if (!key) return res.status(400).json({ message: "key is required" });

    const url = await storage.getObjectURL(key);
    return res.json({ url });
  } catch (err) {
    console.error("getProfilePreviewUrl error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}