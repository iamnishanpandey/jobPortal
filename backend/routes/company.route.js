import express from "express";

import authenticateToken from "../middleware/isAuthenticated.js";
import { requireRoles } from "../middleware/roleGuard.js";
import {
  deleteOwnCompany,
  getAllCompanies,
  getCompanyById,
  registerCompany,
  updateCompany,
} from "../controllers/company.controller.js";

const router = express.Router();

router.route("/register").post(authenticateToken, requireRoles("Recruiter"), registerCompany);
router.route("/get").get(authenticateToken, requireRoles("Recruiter"), getAllCompanies);
router.route("/get/:id").get(authenticateToken, getCompanyById);
router.route("/update/:id").put(authenticateToken, requireRoles("Recruiter"), updateCompany);
router.route("/:id").delete(authenticateToken, requireRoles("Recruiter"), deleteOwnCompany);

export default router;
