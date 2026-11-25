import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import {
  validateObjectId,
  validateOptionalText,
  validateOptionalUrl,
  validateRequiredText,
} from "../utils/validation.js";

export const registerCompany = async (req, res) => {
  try {
    const { companyName } = req.body;
    const companyNameValidation = validateRequiredText(companyName, "Company name", 2, 120);
    if (!companyNameValidation.valid) {
      return res.status(400).json({ message: companyNameValidation.message, success: false });
    }
    let company = await Company.findOne({ name: companyNameValidation.value });
    if (company) {
      return res
        .status(400)
        .json({ message: "Company already exists", success: false });
    }

    company = await Company.create({
      name: companyNameValidation.value,
      userId: [req.id],
      approvalStatus: "pending",
    });

    return res.status(201).json({
      message: "Company request submitted. Waiting for super admin approval.",
      company,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const userId = req.id; // logged in user id
    const companies = await Company.find({ userId }).sort({ createdAt: -1 });
    if (!companies) {
      return res.status(404).json({ message: "No companies found" });
    }
    return res.status(200).json({
      companies,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// get company by id

export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    const companyIdValidation = validateObjectId(companyId, "company id");
    if (!companyIdValidation.valid) {
      return res.status(400).json({ message: companyIdValidation.message, success: false });
    }
    const company = await Company.findById(companyIdValidation.value);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    return res.status(200).json({ company, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

// update company details

export const updateCompany = async (req, res) => {
  try {
    const { name, description, website, location } = req.body;
    const file = req.file;
    const companyIdValidation = validateObjectId(req.params.id, "company id");
    if (!companyIdValidation.valid) {
      return res.status(400).json({ message: companyIdValidation.message, success: false });
    }

    //cloudinary
    const updateData = {};

    if (name !== undefined) {
      const nameValidation = validateRequiredText(name, "Company name", 2, 120);
      if (!nameValidation.valid) {
        return res.status(400).json({ message: nameValidation.message, success: false });
      }
      updateData.name = nameValidation.value;
    }
    if (description !== undefined) {
      const descriptionValidation = validateOptionalText(description, "Description", 2000);
      if (!descriptionValidation.valid) {
        return res.status(400).json({ message: descriptionValidation.message, success: false });
      }
      updateData.description = descriptionValidation.value;
    }
    if (website !== undefined) {
      const websiteValidation = validateOptionalUrl(website, "Website URL");
      if (!websiteValidation.valid) {
        return res.status(400).json({ message: websiteValidation.message, success: false });
      }
      updateData.website = websiteValidation.value;
    }
    if (location !== undefined) {
      const locationValidation = validateOptionalText(location, "Location", 120);
      if (!locationValidation.valid) {
        return res.status(400).json({ message: locationValidation.message, success: false });
      }
      updateData.location = locationValidation.value;
    }

    const existingCompany = await Company.findById(companyIdValidation.value);
    if (!existingCompany) {
      return res.status(404).json({ message: "company not found", success: false });
    }

    const belongsToRecruiter = (existingCompany.userId || []).some(
      (userId) => String(userId) === String(req.id)
    );
    if (!belongsToRecruiter) {
      return res.status(403).json({
        message: "You can only update your own company",
        success: false,
      });
    }

    // Recruiter changes require super admin re-approval.
    updateData.approvalStatus = "pending";
    updateData.approvalNote = "";
    updateData.reviewedBy = null;
    updateData.reviewedAt = null;

    const company = await Company.findByIdAndUpdate(companyIdValidation.value, updateData, {
      new: true,
    });
    if (!company) {
      return res.status(404).json({ message: "company not found", success: false });
    }

    return res.status(200).json({
      message: "Company updated and sent for super admin approval",
      company,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};

export const deleteOwnCompany = async (req, res) => {
  try {
    const companyIdValidation = validateObjectId(req.params.id, "company id");
    if (!companyIdValidation.valid) {
      return res.status(400).json({ message: companyIdValidation.message, success: false });
    }

    const company = await Company.findById(companyIdValidation.value).select("_id userId");
    if (!company) {
      return res.status(404).json({ message: "Company not found", success: false });
    }

    const belongsToRecruiter = (company.userId || []).some(
      (userId) => String(userId) === String(req.id)
    );
    if (!belongsToRecruiter) {
      return res.status(403).json({
        message: "You can only delete your own company",
        success: false,
      });
    }

    const companyJobs = await Job.find({ company: company._id }).select("_id created_by");
    const hasJobsOwnedByOthers = companyJobs.some(
      (job) => String(job.created_by) !== String(req.id)
    );

    if (hasJobsOwnedByOthers) {
      return res.status(403).json({
        message:
          "This company has jobs posted by other recruiters and cannot be deleted from your account",
        success: false,
      });
    }

    const companyJobIds = companyJobs.map((job) => job._id);
    if (companyJobIds.length > 0) {
      await Application.deleteMany({ job: { $in: companyJobIds } });
      await Job.deleteMany({ _id: { $in: companyJobIds } });
    }

    await Company.findByIdAndDelete(company._id);

    return res.status(200).json({
      message: "Company deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", success: false });
  }
};
