import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  parseRequirements,
  trimString,
  validateEmail,
  validateOptionalText,
  validatePassword,
  validatePhoneNumber,
  validateRequiredText,
} from "../utils/validation.js";

const SUPER_ADMIN_ROLE = "SuperAdmin";
const ADMIN_LOGIN_USERNAME = "admin";
const RESUME_EXTENSION_REGEX = /\.(pdf|doc|docx)$/i;

const buildUploadUrl = (filename) => `/uploads/${filename}`;

const isImageFile = (file) => String(file?.mimetype || "").toLowerCase().startsWith("image/");

const isResumeFile = (file) => {
  const mimeType = String(file?.mimetype || "").toLowerCase();
  const originalName = String(file?.originalname || "");
  if (
    [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(mimeType)
  ) {
    return true;
  }
  if (mimeType === "application/octet-stream") {
    return RESUME_EXTENSION_REGEX.test(originalName);
  }
  return RESUME_EXTENSION_REGEX.test(originalName);
};

const normalizeRole = (role) => {
  const normalized = trimString(role);
  if (!normalized) return "";
  if (normalized === "Student" || normalized === "Applicant") return "Applicant";
  if (normalized === "Recruiter") return "Recruiter";
  if (
    normalized === SUPER_ADMIN_ROLE ||
    normalized.toLowerCase() === "super admin" ||
    normalized.toLowerCase() === "admin"
  ) {
    return SUPER_ADMIN_ROLE;
  }
  return normalized;
};

const validateLoginIdentifier = (identifier, requestedRole) => {
  const value = trimString(identifier);
  if (!value) {
    return { valid: false, message: "Email or username is required", value: "" };
  }

  if (requestedRole === SUPER_ADMIN_ROLE) {
    return { valid: true, value: value.toLowerCase(), type: "username" };
  }

  const emailValidation = validateEmail(value);
  if (!emailValidation.valid) {
    return { valid: false, message: emailValidation.message, value: value };
  }
  return { valid: true, value: emailValidation.value, type: "email" };
};

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;
    const profilePhotoFile = req.file || null;

    const fullnameValidation = validateRequiredText(fullname, "Full name", 2, 120);
    if (!fullnameValidation.valid) {
      return res.status(400).json({ message: fullnameValidation.message, success: false });
    }
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.message, success: false });
    }
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return res.status(400).json({ message: phoneValidation.message, success: false });
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message, success: false });
    }
    if (!role) {
      return res.status(400).json({ message: "Role is required", success: false });
    }

    const normalizedRole = normalizeRole(role);
    if (normalizedRole === SUPER_ADMIN_ROLE) {
      return res.status(403).json({
        message: "Super admin accounts cannot be created from registration",
        success: false,
      });
    }
    if (!["Applicant", "Recruiter"].includes(normalizedRole)) {
      return res.status(400).json({
        message: "Invalid role",
        success: false,
      });
    }
    if (profilePhotoFile && !isImageFile(profilePhotoFile)) {
      return res.status(400).json({
        message: "Profile photo must be an image file",
        success: false,
      });
    }
    let user = await User.findOne({ email: emailValidation.value });
    if (user) {
      return res.status(400).json({
        message: "Email already exists",
        success: false,
      });
    }
    const phoneTaken = await User.findOne({ phoneNumber: phoneValidation.value });
    if (phoneTaken) {
      return res.status(400).json({
        message: "Phone number already exists",
        success: false,
      });
    }
    // conver passwords to hashes
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname: fullnameValidation.value,
      email: emailValidation.value,
      phoneNumber: phoneValidation.value,
      password: hashedPassword,
      role: normalizedRole,
      profile: profilePhotoFile
        ? {
            profilePhoto: buildUploadUrl(profilePhotoFile.filename),
          }
        : undefined,
    });

    await newUser.save();

    return res.status(200).json({
      message: `Account Created successfully ${fullname}`,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error register",
      success: false,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required", success: false });
    }
    const requestedRole = normalizeRole(role);
    const roleProvided = Boolean(trimString(role));
    if (roleProvided && !["Applicant", "Recruiter", SUPER_ADMIN_ROLE].includes(requestedRole)) {
      return res.status(400).json({
        message: "Invalid role",
        success: false,
      });
    }

    const identifierValidation = validateLoginIdentifier(email, requestedRole);
    if (!identifierValidation.valid) {
      return res.status(400).json({ message: identifierValidation.message, success: false });
    }

    let user = null;
    if (identifierValidation.type === "username") {
      user = await User.findOne({
        $or: [{ username: identifierValidation.value }, { email: identifierValidation.value }],
      });
    } else {
      user = await User.findOne({ email: identifierValidation.value });
    }

    if (
      !user &&
      requestedRole === SUPER_ADMIN_ROLE &&
      identifierValidation.value === ADMIN_LOGIN_USERNAME
    ) {
      user = await User.findOne({ username: ADMIN_LOGIN_USERNAME });
    }
    if (!user) {
      return res.status(404).json({
        message: "Incorrect email, username, or password",
        success: false,
      });
    }

    const storedRole = normalizeRole(user.role);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect email, username, or password",
        success: false,
      });
    }
    // check role
    if (roleProvided && storedRole !== requestedRole) {
      return res.status(403).json({
        message: "you do not have the role to access this resource",
        success: false,
      });
    }
    if (user.role !== storedRole) {
      user.role = storedRole;
      await user.save();
    }

    //generate token
    const tokenData = {
      userId: user._id,
    };
    const token = await jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    user = {
      _id: user._id,
      fullname: user.fullname,
      username: user.username || "",
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: storedRole,
      profile: user.profile,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "Strict",
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user,
        success: true,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error login",
      success: false,
    });
  }
};

export const logout = (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error logout",
      success: false,
    });
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const files = req.files || {};
    const profilePhotoFile = files.profilePhoto?.[0] || null;
    const resumeFile = files.resume?.[0] || null;

    // cloudinary upload
    let skillsArray = undefined;
    if (skills) {
      skillsArray = parseRequirements(skills);
      if (skillsArray.length > 25) {
        return res.status(400).json({
          message: "Skills cannot exceed 25 items",
          success: false,
        });
      }
    }
    const userId = req.id; //middleware auth
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "user not found",
        success: false,
      });
    }
    if (profilePhotoFile && !isImageFile(profilePhotoFile)) {
      return res.status(400).json({
        message: "Profile photo must be an image file",
        success: false,
      });
    }
    if (resumeFile && !isResumeFile(resumeFile)) {
      return res.status(400).json({
        message: "Resume must be a PDF, DOC, or DOCX file",
        success: false,
      });
    }

    //update database profile
    if (fullname) {
      const fullnameValidation = validateRequiredText(fullname, "Full name", 2, 120);
      if (!fullnameValidation.valid) {
        return res.status(400).json({ message: fullnameValidation.message, success: false });
      }
      user.fullname = fullnameValidation.value;
    }
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ message: emailValidation.message, success: false });
      }
      const emailTakenByOtherUser = await User.findOne({
        email: emailValidation.value,
        _id: { $ne: userId },
      });
      if (emailTakenByOtherUser) {
        return res.status(400).json({ message: "Email already exists", success: false });
      }
      user.email = emailValidation.value;
    }
    if (phoneNumber) {
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.valid) {
        return res.status(400).json({ message: phoneValidation.message, success: false });
      }
      const phoneTakenByOtherUser = await User.findOne({
        phoneNumber: phoneValidation.value,
        _id: { $ne: userId },
      });
      if (phoneTakenByOtherUser) {
        return res.status(400).json({ message: "Phone number already exists", success: false });
      }
      user.phoneNumber = phoneValidation.value;
    }
    if (bio !== undefined) {
      const bioValidation = validateOptionalText(bio, "Bio", 1200);
      if (!bioValidation.valid) {
        return res.status(400).json({ message: bioValidation.message, success: false });
      }
      user.profile.bio = bioValidation.value;
    }
    if (skillsArray !== undefined) {
      user.profile.skills = skillsArray;
    }
    if (profilePhotoFile) {
      user.profile.profilePhoto = buildUploadUrl(profilePhotoFile.filename);
    }
    if (resumeFile) {
      user.profile.resume = buildUploadUrl(resumeFile.filename);
      user.profile.resumeOriginalName = trimString(resumeFile.originalname);
    }

    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      username: user.username || "",
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200).json({
      message: "Profile Updated Successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error Uploading profile",
      success: false,
    });
  }
};
