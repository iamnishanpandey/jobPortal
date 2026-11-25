import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
import { Application } from "../models/application.model.js";
import {
  parseRequirements,
  validateInteger,
  validateObjectId,
  validateOptionalText,
  validateRequiredText,
} from "../utils/validation.js";

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value = "") => normalizeText(value).split(" ").filter(Boolean);

const buildJobSearchText = (job) =>
  [
    job?.title,
    job?.description,
    job?.location,
    job?.jobType,
    ...(job?.requirements || []),
    job?.company?.name,
  ]
    .filter(Boolean)
    .join(" ");

const levenshteinDistance = (first = "", second = "") => {
  if (first === second) return 0;
  if (!first.length) return second.length;
  if (!second.length) return first.length;

  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  const current = new Array(second.length + 1).fill(0);

  for (let i = 1; i <= first.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= second.length; j += 1) {
      const substitutionCost = first[i - 1] === second[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      );
    }
    for (let j = 0; j <= second.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[second.length];
};

const tokenSimilarity = (firstToken = "", secondToken = "") => {
  if (!firstToken || !secondToken) return 0;
  if (firstToken === secondToken) return 1;
  const distance = levenshteinDistance(firstToken, secondToken);
  const longestLength = Math.max(firstToken.length, secondToken.length);
  return 1 - distance / longestLength;
};

const fuzzyScore = (sourceText, keyword) => {
  const sourceTokens = tokenize(sourceText);
  const keywordTokens = tokenize(keyword);
  if (!sourceTokens.length || !keywordTokens.length) return 0;

  const scores = keywordTokens.map((keywordToken) => {
    if (sourceTokens.includes(keywordToken)) return 1;

    let bestScore = 0;
    for (const sourceToken of sourceTokens) {
      const similarity = tokenSimilarity(sourceToken, keywordToken);
      if (similarity > bestScore) bestScore = similarity;
      if (bestScore >= 1) break;
    }
    return bestScore;
  });

  const totalScore = scores.reduce((sum, value) => sum + value, 0);
  return totalScore / scores.length;
};

const minimumFuzzyScore = (keyword) => {
  const normalizedKeyword = normalizeText(keyword);
  if (normalizedKeyword.length <= 3) return 0.9;
  if (normalizedKeyword.length <= 5) return 0.78;
  return 0.62;
};

export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      postingDurationDays,
      position,
      companyId,
      experience,
    } = req.body;
    const userId = req.id;

    const titleValidation = validateRequiredText(title, "Title", 2, 120);
    if (!titleValidation.valid) {
      return res.status(400).json({ message: titleValidation.message, success: false });
    }
    const descriptionValidation = validateRequiredText(description, "Description", 10, 5000);
    if (!descriptionValidation.valid) {
      return res.status(400).json({ message: descriptionValidation.message, success: false });
    }
    const locationValidation = validateRequiredText(location, "Location", 2, 120);
    if (!locationValidation.valid) {
      return res.status(400).json({ message: locationValidation.message, success: false });
    }
    const jobTypeValidation = validateRequiredText(jobType, "Job type", 2, 60);
    if (!jobTypeValidation.valid) {
      return res.status(400).json({ message: jobTypeValidation.message, success: false });
    }
    const companyIdValidation = validateObjectId(companyId, "company id");
    if (!companyIdValidation.valid) {
      return res.status(400).json({ message: companyIdValidation.message, success: false });
    }

    const salaryValidation = validateInteger(salary, "Salary", { min: 1, max: 1000000000 });
    if (!salaryValidation.valid) {
      return res.status(400).json({ message: salaryValidation.message, success: false });
    }
    const positionValidation = validateInteger(position, "Open positions", { min: 1, max: 10000 });
    if (!positionValidation.valid) {
      return res.status(400).json({ message: positionValidation.message, success: false });
    }
    const experienceValidation = validateInteger(experience, "Experience", { min: 0, max: 50 });
    if (!experienceValidation.valid) {
      return res.status(400).json({ message: experienceValidation.message, success: false });
    }
    const postingDurationValidation = validateInteger(
      postingDurationDays ?? 30,
      "Posting duration",
      {
        min: 1,
        max: 365,
      }
    );
    if (!postingDurationValidation.valid) {
      return res.status(400).json({ message: postingDurationValidation.message, success: false });
    }

    const parsedRequirements = parseRequirements(requirements);
    if (parsedRequirements.length === 0) {
      return res.status(400).json({
        message: "At least one requirement is required",
        success: false,
      });
    }
    if (parsedRequirements.length > 30) {
      return res.status(400).json({
        message: "Requirements cannot exceed 30 items",
        success: false,
      });
    }

    const company = await Company.findById(companyIdValidation.value);
    if (!company) {
      return res.status(404).json({ message: "Company not found", success: false });
    }
    const belongsToRecruiter = (company.userId || []).some((id) => String(id) === String(userId));
    if (!belongsToRecruiter) {
      return res.status(403).json({
        message: "You can only post jobs for your own company",
        success: false,
      });
    }
    if (company.approvalStatus !== "approved") {
      return res.status(403).json({
        message: "This company is not approved by super admin yet",
        success: false,
      });
    }

    const job = await Job.create({
      title: titleValidation.value,
      description: descriptionValidation.value,
      requirements: parsedRequirements,
      salary: String(salaryValidation.value),
      location: locationValidation.value,
      jobType: jobTypeValidation.value,
      postingDurationDays: postingDurationValidation.value,
      position: positionValidation.value,
      company: companyIdValidation.value,
      experienceLevel: experienceValidation.value,
      created_by: userId,
    });
    return res
      .status(201)
      .json({ message: "job posted successfully", success: true, job });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", status: false });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const keywordValidation = validateOptionalText(req.query.keyword, "Keyword", 100);
    if (!keywordValidation.valid) {
      return res.status(400).json({ message: keywordValidation.message, success: false });
    }
    const keyword = String(keywordValidation.value || "").trim();

    if (!keyword) {
      const jobs = await Job.find()
        .sort({ createdAt: -1 })
        .populate({ path: "company", select: "name" });
      return res.status(200).json({ jobs, success: true });
    }

    const safeKeyword = escapeRegExp(keyword);
    const query = {
      $or: [
        { title: { $regex: safeKeyword, $options: "i" } },
        { description: { $regex: safeKeyword, $options: "i" } },
        { requirements: { $regex: safeKeyword, $options: "i" } },
        { location: { $regex: safeKeyword, $options: "i" } },
        { jobType: { $regex: safeKeyword, $options: "i" } },
      ],
    };

    let jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .populate({ path: "company", select: "name" });

    // Typo-tolerant fallback: if strict regex has no hit, use fuzzy scoring.
    if (jobs.length === 0) {
      const allJobs = await Job.find().populate({ path: "company", select: "name" });
      const threshold = minimumFuzzyScore(keyword);

      jobs = allJobs
        .map((job) => ({
          job,
          score: fuzzyScore(buildJobSearchText(job), keyword),
        }))
        .filter((entry) => entry.score >= threshold)
        .sort(
          (first, second) =>
            second.score - first.score ||
            new Date(second.job.createdAt).getTime() -
              new Date(first.job.createdAt).getTime()
        )
        .map((entry) => entry.job);
    }

    return res.status(200).json({ jobs, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", success: false });
  }
};

export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const jobIdValidation = validateObjectId(jobId, "job id");
    if (!jobIdValidation.valid) {
      return res.status(400).json({ message: jobIdValidation.message, success: false });
    }
    const job = await Job.findById(jobIdValidation.value).populate({
      path: "company",
      select: "name description website location logo",
    });
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }
    return res.status(200).json({ job, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", success: false });
  }
};

//admin job created
export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;
    const jobs = await Job.find({ created_by: adminId })
      .sort({ createdAt: -1 })
      .populate({
        path: "company",
      });
    if (!jobs) {
      return res.status(404).json({ message: "No jobs found", success: false });
    }
    return res.status(200).json({ jobs, success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", success: false });
  }
};

export const deleteOwnJob = async (req, res) => {
  try {
    const jobIdValidation = validateObjectId(req.params.id, "job id");
    if (!jobIdValidation.valid) {
      return res.status(400).json({ message: jobIdValidation.message, success: false });
    }

    const job = await Job.findById(jobIdValidation.value).select("_id created_by");
    if (!job) {
      return res.status(404).json({ message: "Job not found", success: false });
    }

    if (String(job.created_by) !== String(req.id)) {
      return res.status(403).json({
        message: "You can only delete your own jobs",
        success: false,
      });
    }

    await Application.deleteMany({ job: job._id });
    await Job.findByIdAndDelete(job._id);

    return res.status(200).json({
      message: "Job deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", success: false });
  }
};
