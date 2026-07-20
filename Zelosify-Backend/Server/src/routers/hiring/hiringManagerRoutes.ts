import { Router, type RequestHandler } from "express";
import { authenticateUser } from "../../middlewares/auth/authenticateMiddleware.js";
import { authorizeRole } from "../../middlewares/auth/authorizeMiddleware.js";
import {
  fetchManagerOpenings,
  fetchManagerOpeningProfiles,
  shortlistProfile,
  rejectProfile,
  getProfilePreviewUrlForManager,
} from "../../controllers/hiring/hiringManagerController.js";



const router = Router();
router.get("/profiles/preview", getProfilePreviewUrlForManager as RequestHandler);
router.use(authenticateUser as RequestHandler);
router.use(authorizeRole("HIRING_MANAGER") as RequestHandler);

router.get("/openings", fetchManagerOpenings as RequestHandler);
router.get("/openings/:id/profiles", fetchManagerOpeningProfiles as RequestHandler);
router.post("/profiles/:id/shortlist", shortlistProfile as RequestHandler);
router.post("/profiles/:id/reject", rejectProfile as RequestHandler);

export default router;