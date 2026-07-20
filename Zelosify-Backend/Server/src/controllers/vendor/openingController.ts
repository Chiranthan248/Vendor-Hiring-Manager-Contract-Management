import type { Request, Response } from "express";
import {
  getOpeningsByTenant,
  getOpeningById,
} from "../../services/query/openingQueryService.js";

export async function fetchVendorOpenings(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.tenant?.tenantId) {
      return res.status(403).json({ message: "Tenant not found for user" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await getOpeningsByTenant(
      user.tenant.tenantId,
      page,
      limit
    );

    return res.json({ message: "success", ...result });
  } catch (err: any) {
    console.error("fetchVendorOpenings error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function fetchVendorOpeningById(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (!user?.tenant?.tenantId) {
      return res.status(403).json({ message: "Tenant not found for user" });
    }

    const { id } = req.params;
    const opening = await getOpeningById(id, user.tenant.tenantId);

    if (!opening) {
      return res.status(404).json({ message: "Opening not found" });
    }

    return res.json({ message: "success", data: opening });
  } catch (err: any) {
    console.error("fetchVendorOpeningById error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}