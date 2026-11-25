import { User } from "../models/user.model.js";

export const requireRoles =
  (...roles) =>
  async (req, res, next) => {
    try {
      if (!req.id) {
        return res.status(401).json({ message: "Unauthorized", success: false });
      }

      const user = await User.findById(req.id).select("role");
      if (!user) {
        return res.status(401).json({ message: "User not found", success: false });
      }

      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden", success: false });
      }

      req.currentUserRole = user.role;
      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", success: false });
    }
  };
