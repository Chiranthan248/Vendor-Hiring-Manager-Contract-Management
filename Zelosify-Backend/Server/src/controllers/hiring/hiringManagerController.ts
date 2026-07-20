import type { Request, Response } from "express";
import prisma from "../../config/prisma/prisma.js";
import {
  getManagerOpenings,
  getOpeningByIdForManager,
} from "../../services/query/openingQueryService.js";
import { AwsStorageService } from "../../services/storage/aws/awsStorageService.js";

const storage = new AwsStorageService();

export async function getProfilePreviewUrlForManager(req: Request, res: Response) {
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

export async function fetchManagerOpenings(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const openings = await getManagerOpenings(user.id);
    return res.json({ message: "success", data: openings });
  } catch (err) {
    console.error("fetchManagerOpenings error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function fetchManagerOpeningProfiles(
  req: Request,
  res: Response
) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const opening = await getOpeningByIdForManager(id, user.id);
    if (!opening) {
      return res.status(404).json({ message: "Opening not found" });
    }

    return res.json({ message: "success", data: opening });
  } catch (err) {
    console.error("fetchManagerOpeningProfiles error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function shortlistProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: parseInt(id) },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.opening.hiringManagerId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await prisma.hiringProfile.update({
      where: { id: parseInt(id) },
      data: {
        status: "SHORTLISTED",
        shortlistedBy: user.id,
        shortlistedAt: new Date(),
      },
    });

    return res.json({ message: "Profile shortlisted", data: updated });
  } catch (err) {
    console.error("shortlistProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function rejectProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const profile = await prisma.hiringProfile.findUnique({
      where: { id: parseInt(id) },
      include: { opening: true },
    });

    if (!profile || profile.isDeleted) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.opening.hiringManagerId !== user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await prisma.hiringProfile.update({
      where: { id: parseInt(id) },
      data: {
        status: "REJECTED",
        rejectedBy: user.id,
        rejectedAt: new Date(),
      },
    });

    return res.json({ message: "Profile rejected", data: updated });
  } catch (err) {
    console.error("rejectProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}