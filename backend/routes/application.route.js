import express from "express";

import authenticateToken from "../middleware/isAuthenticated.js";
import {
  applyJob,
  getApplicationDetails,
  getApplicantProfile,
  getApplicants,
  getAppliedJobs,
  updateStatus,
} from "../controllers/application.controller.js";

const router = express.Router();

router.route("/apply/:id").get(authenticateToken, applyJob);
router.route("/get").get(authenticateToken, getAppliedJobs);
router.route("/details/:id").get(authenticateToken, getApplicationDetails);
router.route("/profile/:id").get(authenticateToken, getApplicantProfile);
router.route("/:id/applicants").get(authenticateToken, getApplicants);
router.route("/status/:id/update").post(authenticateToken, updateStatus);

export default router;
