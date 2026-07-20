import express, { type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  fetchVendorOpenings,
  fetchVendorOpeningById,
} from "../../controllers/vendor/openingController.js";
import {
  presignUploadURLs,
  submitProfiles,
  softDeleteProfile,
  getProfilePreviewUrl,
} from "../../controllers/vendor/profileUploadController.js";


const router = express.Router();

router.use(authenticateUser as RequestHandler);
router.use(authorizeRole("IT_VENDOR") as RequestHandler);
router.get("/profiles/preview", getProfilePreviewUrl as RequestHandler);
router.get("/openings", fetchVendorOpenings as RequestHandler);
router.get("/openings/:id", fetchVendorOpeningById as RequestHandler);
router.post("/openings/:id/profiles/presign", presignUploadURLs as RequestHandler);
router.post("/openings/:id/profiles/upload", submitProfiles as RequestHandler);
router.delete("/profiles/:id", softDeleteProfile as RequestHandler);

export default router;