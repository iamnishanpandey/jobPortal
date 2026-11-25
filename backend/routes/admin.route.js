import express from "express";
import authenticateToken from "../middleware/isAuthenticated.js";
import { requireRoles } from "../middleware/roleGuard.js";
import {
  deleteApplicationAdmin,
  deleteCompanyAdmin,
  deleteJobAdmin,
  deleteUserAdmin,
  getAllApplicationsAdmin,
  getAllCompaniesAdmin,
  getAllJobsAdmin,
  getAllUsersAdmin,
  getSuperAdminDashboard,
  reviewCompanyAdmin,
  updateApplicationStatusAdmin,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticateToken, requireRoles("SuperAdmin"));

router.route("/dashboard").get(getSuperAdminDashboard);

router.route("/users").get(getAllUsersAdmin);
router.route("/users/:id").delete(deleteUserAdmin);

router.route("/companies").get(getAllCompaniesAdmin);
router.route("/companies/:id").delete(deleteCompanyAdmin);
router.route("/companies/:id/review").patch(reviewCompanyAdmin);

router.route("/jobs").get(getAllJobsAdmin);
router.route("/jobs/:id").delete(deleteJobAdmin);

router.route("/applications").get(getAllApplicationsAdmin);
router.route("/applications/:id").delete(deleteApplicationAdmin);
router.route("/applications/:id/status").patch(updateApplicationStatusAdmin);

export default router;
