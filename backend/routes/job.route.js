import express from "express";

import authenticateToken from "../middleware/isAuthenticated.js";
import { requireRoles } from "../middleware/roleGuard.js";
import {
  deleteOwnJob,
  getAdminJobs,
  getAllJobs,
  getJobById,
  postJob,
} from "../controllers/job.controller.js";

const router = express.Router();

router.route("/post").post(authenticateToken, requireRoles("Recruiter"), postJob);
router.route("/get").get(authenticateToken, getAllJobs);
router.route("/getadminjobs").get(authenticateToken, requireRoles("Recruiter"), getAdminJobs);
router.route("/get/:id").get(authenticateToken, getJobById);
router.route("/:id").delete(authenticateToken, requireRoles("Recruiter"), deleteOwnJob);
export default router;
