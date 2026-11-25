import express from "express";
import {
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/user.controller.js";
import authenticateToken from "../middleware/isAuthenticated.js";
import { profileUpload, singleupload } from "../middleware/multer.js";

const router = express.Router();

router.route("/register").post(singleupload, register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/profile/update").post(authenticateToken, profileUpload, updateProfile);

export default router;
