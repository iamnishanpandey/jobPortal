import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import {
  validateFutureDate,
  validateObjectId,
  validateOptionalText,
} from "../utils/validation.js";

const APPLICANT_ROLES = new Set(["Applicant", "Student"]);
const DEFAULT_POSTING_DURATION_DAYS = 30;

const getCurrentUser = async (userId) => User.findById(userId).select("role");

const getJobPostingEndDate = (job) => {
  const createdAt = new Date(job?.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  const durationValue = Number(job?.postingDurationDays);
  const durationDays =
    Number.isFinite(durationValue) && durationValue > 0
      ? Math.floor(durationValue)
      : DEFAULT_POSTING_DURATION_DAYS;

  const endDate = new Date(createdAt);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
};

export const applyJob = async (req, res) => {
  try {
    const userId = req.id;
    const jobId = req.params.id;
    const jobIdValidation = validateObjectId(jobId, "job id");
    if (!jobIdValidation.valid) {
      return res.status(400).json({ message: jobIdValidation.message, success: false });
    }
    const user = await getCurrentUser(userId);
    if (!user || !APPLICANT_ROLES.has(user.role)) {
      return res.status(403).json({
        message: "Only applicants can apply for jobs",
        success: false,
      });
    }
    // check if the user already has applied for this job
    const existingApplication = await Application.findOne({
      job: jobIdValidation.value,
      applicant: userId,
    });
    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
        success: false,
      });
    }
    //check if the job exists or not
    const job = await Job.findById(jobIdValidation.value);
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }
    const postingEndDate = getJobPostingEndDate(job);
    if (postingEndDate && Date.now() > postingEndDate.getTime()) {
      return res.status(400).json({
        message: `This job posting ended on ${postingEndDate.toISOString()}`,
        endedAt: postingEndDate.toISOString(),
        success: false,
      });
    }
    // create a new application

    const newApplication = await Application.create({
      job: jobIdValidation.value,
      applicant: userId,
    });
    job.applications.push(newApplication._id);
    await job.save();

    return res
      .status(201)
      .json({ message: "Application submitted", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const getAppliedJobs = async (req, res) => {
  try {
    const userId = req.id;
    const user = await getCurrentUser(userId);
    if (!user || !APPLICANT_ROLES.has(user.role)) {
      return res.status(403).json({
        message: "Only applicants can view applied jobs",
        success: false,
      });
    }

    const application = await Application.find({ applicant: userId })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        options: { sort: { createdAt: -1 } },
        populate: { path: "company", options: { sort: { createdAt: -1 } } },
      });
    if (!application) {
      return res
        .status(404)
        .json({ message: "No applications found", success: false });
    }

    return res.status(200).json({ application, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const getApplicationDetails = async (req, res) => {
  try {
    const userId = req.id;
    const applicationId = req.params.id;
    const applicationIdValidation = validateObjectId(applicationId, "application id");
    if (!applicationIdValidation.valid) {
      return res.status(400).json({ message: applicationIdValidation.message, success: false });
    }
    const user = await getCurrentUser(userId);
    if (!user || !APPLICANT_ROLES.has(user.role)) {
      return res.status(403).json({
        message: "Only applicants can view application details",
        success: false,
      });
    }

    const application = await Application.findById(applicationIdValidation.value).populate({
      path: "job",
      populate: { path: "company" },
    });

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
        success: false,
      });
    }

    if (String(application.applicant) !== String(userId)) {
      return res.status(403).json({
        message: "You can only view your own application details",
        success: false,
      });
    }

    return res.status(200).json({ application, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const getApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;
    const jobIdValidation = validateObjectId(jobId, "job id");
    if (!jobIdValidation.valid) {
      return res.status(400).json({ message: jobIdValidation.message, success: false });
    }
    const recruiterId = req.id;
    const user = await getCurrentUser(recruiterId);
    if (!user || user.role !== "Recruiter") {
      return res.status(403).json({
        message: "Only recruiters can view applicants",
        success: false,
      });
    }

    const job = await Job.findById(jobIdValidation.value).populate({
      path: "applications",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "applicant",
        select:
          "fullname email phoneNumber role profile.bio profile.skills profile.resume profile.resumeOriginalName profile.profilePhoto createdAt",
      },
    });
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }
    if (String(job.created_by) !== String(recruiterId)) {
      return res.status(403).json({
        message: "You can only view applicants for your own jobs",
        success: false,
      });
    }

    return res.status(200).json({ job, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const getApplicantProfile = async (req, res) => {
  try {
    const applicationId = req.params.id;
    const applicationIdValidation = validateObjectId(applicationId, "application id");
    if (!applicationIdValidation.valid) {
      return res.status(400).json({ message: applicationIdValidation.message, success: false });
    }
    const recruiterId = req.id;
    const user = await getCurrentUser(recruiterId);
    if (!user || user.role !== "Recruiter") {
      return res.status(403).json({
        message: "Only recruiters can view applicant profile",
        success: false,
      });
    }

    const application = await Application.findById(applicationIdValidation.value)
      .populate({
        path: "job",
        select: "title location jobType company created_by",
        populate: { path: "company", select: "name" },
      })
      .populate({
        path: "applicant",
        select:
          "fullname email phoneNumber role profile.bio profile.skills profile.resume profile.resumeOriginalName profile.profilePhoto createdAt",
      });

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
        success: false,
      });
    }

    if (!application.job || String(application.job.created_by) !== String(recruiterId)) {
      return res.status(403).json({
        message: "You can only view profiles for your own job applicants",
        success: false,
      });
    }

    return res.status(200).json({ application, success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, interviewDate, statusNote } = req.body;
    const applicationId = req.params.id;
    const applicationIdValidation = validateObjectId(applicationId, "application id");
    if (!applicationIdValidation.valid) {
      return res.status(400).json({ message: applicationIdValidation.message, success: false });
    }
    const recruiterId = req.id;
    const user = await getCurrentUser(recruiterId);
    if (!user || user.role !== "Recruiter") {
      return res.status(403).json({
        message: "Only recruiters can update application status",
        success: false,
      });
    }
    if (!status) {
      return res.status(400).json({
        message: "status is required",
        success: false,
      });
    }
    const normalizedStatus = String(status).toLowerCase();
    if (!["pending", "accepted", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({
        message: "Invalid status value",
        success: false,
      });
    }
    const interviewDateValidation = validateFutureDate(interviewDate, "Interview date");
    if (!interviewDateValidation.valid) {
      return res.status(400).json({ message: interviewDateValidation.message, success: false });
    }
    const statusNoteValidation = validateOptionalText(statusNote, "Status note", 500);
    if (!statusNoteValidation.valid) {
      return res.status(400).json({ message: statusNoteValidation.message, success: false });
    }

    // find the application by applicantion id
    const application = await Application.findOne({ _id: applicationIdValidation.value }).populate({
      path: "job",
      select: "created_by",
    });
    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
        success: false,
      });
    }
    if (!application.job || String(application.job.created_by) !== String(recruiterId)) {
      return res.status(403).json({
        message: "You can only update applications for your own jobs",
        success: false,
      });
    }

    // update the status
    application.status = normalizedStatus;
    if (interviewDateValidation.isProvided) {
      application.interviewDate = interviewDateValidation.value;
    }
    if (statusNote !== undefined) {
      application.statusNote = statusNoteValidation.value;
    }
    await application.save();

    return res
      .status(200)
      .json({ message: "Application status updated", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", success: false });
  }
};
