import { Application } from "../models/application.model.js";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import {
  validateFutureDate,
  validateObjectId,
  validateOptionalText,
} from "../utils/validation.js";

const SUPER_ADMIN_ROLE = "SuperAdmin";

const normalizeStatus = (value) => String(value || "").toLowerCase().trim();
const normalizeCompanyReviewStatus = (value) => String(value || "").toLowerCase().trim();

const uniqueIds = (values = []) => [
  ...new Set(values.filter(Boolean).map((value) => String(value))),
];

export const getSuperAdminDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalApplicants,
      totalRecruiters,
      totalSuperAdmins,
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      rejectedCompanies,
      totalJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      recentUsers,
      recentCompanies,
      recentJobs,
      recentApplications,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $in: ["Applicant", "Student"] } }),
      User.countDocuments({ role: "Recruiter" }),
      User.countDocuments({ role: SUPER_ADMIN_ROLE }),
      Company.countDocuments(),
      Company.countDocuments({
        $or: [{ approvalStatus: "pending" }, { approvalStatus: { $exists: false } }],
      }),
      Company.countDocuments({ approvalStatus: "approved" }),
      Company.countDocuments({ approvalStatus: "rejected" }),
      Job.countDocuments(),
      Application.countDocuments(),
      Application.countDocuments({ status: "pending" }),
      Application.countDocuments({ status: "accepted" }),
      Application.countDocuments({ status: "rejected" }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select("fullname username email role createdAt"),
      Company.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate({ path: "userId", select: "fullname username email role" }),
      Job.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate({ path: "company", select: "name location" })
        .populate({ path: "created_by", select: "fullname username email role" }),
      Application.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate({
          path: "job",
          select: "title created_by company",
          populate: { path: "company", select: "name" },
        })
        .populate({ path: "applicant", select: "fullname username email role" }),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        counts: {
          totalUsers,
          totalApplicants,
          totalRecruiters,
          totalSuperAdmins,
          totalCompanies,
          pendingCompanies,
          approvedCompanies,
          rejectedCompanies,
          totalJobs,
          totalApplications,
          pendingApplications,
          acceptedApplications,
          rejectedApplications,
        },
        recent: {
          users: recentUsers,
          companies: recentCompanies,
          jobs: recentJobs,
          applications: recentApplications,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const reviewCompanyAdmin = async (req, res) => {
  try {
    const companyIdValidation = validateObjectId(req.params.id, "company id");
    if (!companyIdValidation.valid) {
      return res.status(400).json({ message: companyIdValidation.message, success: false });
    }

    const { status, note } = req.body;
    const normalizedStatus = normalizeCompanyReviewStatus(status);
    if (!["approved", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
        success: false,
      });
    }

    const noteValidation = validateOptionalText(note, "Review note", 500);
    if (!noteValidation.valid) {
      return res.status(400).json({ message: noteValidation.message, success: false });
    }

    const company = await Company.findById(companyIdValidation.value);
    if (!company) {
      return res.status(404).json({ message: "Company not found", success: false });
    }

    company.approvalStatus = normalizedStatus;
    company.approvalNote = noteValidation.value;
    company.reviewedBy = req.id;
    company.reviewedAt = new Date();
    await company.save();

    return res.status(200).json({
      message: `Company ${normalizedStatus} successfully`,
      company,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select("fullname username email phoneNumber role profile createdAt updatedAt");

    return res.status(200).json({ users, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteUserAdmin = async (req, res) => {
  try {
    const userIdValidation = validateObjectId(req.params.id, "user id");
    if (!userIdValidation.valid) {
      return res.status(400).json({ message: userIdValidation.message, success: false });
    }

    if (String(userIdValidation.value) === String(req.id)) {
      return res.status(400).json({
        message: "You cannot delete your own super admin account",
        success: false,
      });
    }

    const user = await User.findById(userIdValidation.value).select("role");
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    if (user.role === SUPER_ADMIN_ROLE) {
      const totalSuperAdmins = await User.countDocuments({ role: SUPER_ADMIN_ROLE });
      if (totalSuperAdmins <= 1) {
        return res.status(400).json({
          message: "At least one super admin account must remain",
          success: false,
        });
      }
    }

    const applicantApplications = await Application.find({ applicant: userIdValidation.value }).select(
      "_id job"
    );
    const applicantApplicationIds = uniqueIds(applicantApplications.map((item) => item._id));
    const applicantJobIds = uniqueIds(applicantApplications.map((item) => item.job));

    if (applicantApplicationIds.length > 0 && applicantJobIds.length > 0) {
      await Job.updateMany(
        { _id: { $in: applicantJobIds } },
        { $pull: { applications: { $in: applicantApplicationIds } } }
      );
    }
    if (applicantApplicationIds.length > 0) {
      await Application.deleteMany({ _id: { $in: applicantApplicationIds } });
    }

    const recruiterJobs = await Job.find({ created_by: userIdValidation.value }).select("_id");
    const recruiterJobIds = uniqueIds(recruiterJobs.map((item) => item._id));
    if (recruiterJobIds.length > 0) {
      await Application.deleteMany({ job: { $in: recruiterJobIds } });
      await Job.deleteMany({ _id: { $in: recruiterJobIds } });
    }

    await Company.updateMany({}, { $pull: { userId: userIdValidation.value } });
    await User.findByIdAndDelete(userIdValidation.value);

    return res.status(200).json({
      message: "User and related records deleted",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getAllCompaniesAdmin = async (req, res) => {
  try {
    const companies = await Company.find()
      .sort({ createdAt: -1 })
      .populate({ path: "userId", select: "fullname username email role" });
    const companyIds = companies.map((company) => company._id);

    const jobCounts = await Job.aggregate([
      { $match: { company: { $in: companyIds } } },
      { $group: { _id: "$company", totalJobs: { $sum: 1 } } },
    ]);
    const jobCountByCompany = new Map(
      jobCounts.map((record) => [String(record._id), record.totalJobs])
    );

    const enrichedCompanies = companies.map((company) => ({
      ...company.toObject(),
      totalJobs: jobCountByCompany.get(String(company._id)) || 0,
    }));

    return res.status(200).json({ companies: enrichedCompanies, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteCompanyAdmin = async (req, res) => {
  try {
    const companyIdValidation = validateObjectId(req.params.id, "company id");
    if (!companyIdValidation.valid) {
      return res.status(400).json({ message: companyIdValidation.message, success: false });
    }

    const company = await Company.findById(companyIdValidation.value).select("_id");
    if (!company) {
      return res.status(404).json({ message: "Company not found", success: false });
    }

    const companyJobs = await Job.find({ company: companyIdValidation.value }).select("_id");
    const companyJobIds = uniqueIds(companyJobs.map((item) => item._id));

    if (companyJobIds.length > 0) {
      await Application.deleteMany({ job: { $in: companyJobIds } });
      await Job.deleteMany({ _id: { $in: companyJobIds } });
    }

    await Company.findByIdAndDelete(companyIdValidation.value);

    return res.status(200).json({
      message: "Company and related jobs deleted",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getAllJobsAdmin = async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ createdAt: -1 })
      .populate({ path: "company", select: "name location" })
      .populate({ path: "created_by", select: "fullname username email role" });

    return res.status(200).json({ jobs, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteJobAdmin = async (req, res) => {
  try {
    const jobIdValidation = validateObjectId(req.params.id, "job id");
    if (!jobIdValidation.valid) {
      return res.status(400).json({ message: jobIdValidation.message, success: false });
    }

    const job = await Job.findById(jobIdValidation.value).select("_id");
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    await Application.deleteMany({ job: jobIdValidation.value });
    await Job.findByIdAndDelete(jobIdValidation.value);

    return res.status(200).json({
      message: "Job and related applications deleted",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getAllApplicationsAdmin = async (req, res) => {
  try {
    const applications = await Application.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        select: "title created_by company",
        populate: { path: "company", select: "name" },
      })
      .populate({ path: "applicant", select: "fullname username email role" });

    return res.status(200).json({ applications, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const updateApplicationStatusAdmin = async (req, res) => {
  try {
    const { status, interviewDate, statusNote } = req.body;
    const applicationIdValidation = validateObjectId(req.params.id, "application id");
    if (!applicationIdValidation.valid) {
      return res.status(400).json({ message: applicationIdValidation.message, success: false });
    }

    const normalizedStatus = normalizeStatus(status);
    if (!normalizedStatus) {
      return res.status(400).json({ message: "Status is required", success: false });
    }
    if (!["pending", "accepted", "rejected"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status value", success: false });
    }

    const interviewDateValidation = validateFutureDate(interviewDate, "Interview date");
    if (!interviewDateValidation.valid) {
      return res.status(400).json({ message: interviewDateValidation.message, success: false });
    }

    const statusNoteValidation = validateOptionalText(statusNote, "Status note", 500);
    if (!statusNoteValidation.valid) {
      return res.status(400).json({ message: statusNoteValidation.message, success: false });
    }

    const application = await Application.findById(applicationIdValidation.value)
      .populate({
        path: "job",
        select: "title created_by company",
        populate: { path: "company", select: "name" },
      })
      .populate({ path: "applicant", select: "fullname username email role" });

    if (!application) {
      return res.status(404).json({ message: "Application not found", success: false });
    }

    application.status = normalizedStatus;
    if (interviewDateValidation.isProvided) {
      application.interviewDate = interviewDateValidation.value;
    }
    if (statusNote !== undefined) {
      application.statusNote = statusNoteValidation.value;
    }
    await application.save();

    return res.status(200).json({
      message: "Application status updated",
      application,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteApplicationAdmin = async (req, res) => {
  try {
    const applicationIdValidation = validateObjectId(req.params.id, "application id");
    if (!applicationIdValidation.valid) {
      return res.status(400).json({ message: applicationIdValidation.message, success: false });
    }

    const application = await Application.findById(applicationIdValidation.value).select("_id job");
    if (!application) {
      return res.status(404).json({ message: "Application not found", success: false });
    }

    if (application.job) {
      await Job.findByIdAndUpdate(application.job, { $pull: { applications: application._id } });
    }
    await Application.findByIdAndDelete(applicationIdValidation.value);

    return res.status(200).json({
      message: "Application deleted",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};
