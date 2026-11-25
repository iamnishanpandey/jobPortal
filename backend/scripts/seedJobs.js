import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "../utils/db.js";
import { User } from "../models/user.model.js";
import { Company } from "../models/company.model.js";
import { Job } from "../models/job.model.js";

dotenv.config({});

const MINIMUM_SEEDED_JOBS = 100;
const JOBS_PER_COMPANY = 7;

const superAdminSeed = {
  fullname: "Super Admin",
  username: "admin",
  email: "admin@jobportal.local",
  phoneNumber: "9700000001",
  password: "password",
  role: "SuperAdmin",
};

const recruiterSeed = {
  fullname: "Nepal Recruiter",
  email: "recruiter@jobportal.demo",
  phoneNumber: "9800000000",
  password: "Recruiter@123",
  role: "Recruiter",
};

const companySeeds = [
  {
    name: "Himalaya Tech Pvt Ltd",
    description: "Software development company serving businesses in Nepal.",
    website: "https://himalayatech.example",
    location: "Kathmandu, Nepal",
  },
  {
    name: "Everest Fintech Solutions",
    description: "Digital payment and finance technology services.",
    website: "https://everestfintech.example",
    location: "Lalitpur, Nepal",
  },
  {
    name: "Pokhara Digital Studio",
    description: "Creative design and digital product studio.",
    website: "https://pokharadigital.example",
    location: "Pokhara, Nepal",
  },
  {
    name: "Terai Agro Innovations",
    description: "Agri-tech and supply software solutions for Terai businesses.",
    website: "https://teraiagro.example",
    location: "Birgunj, Nepal",
  },
  {
    name: "Koshi Data Systems",
    description: "Data and IT consulting company in eastern Nepal.",
    website: "https://koshidata.example",
    location: "Biratnagar, Nepal",
  },
  {
    name: "Lumbini HealthTech",
    description: "Healthcare systems and clinical technology support.",
    website: "https://lumbinihealth.example",
    location: "Butwal, Nepal",
  },
  {
    name: "Janakpur Logistics Hub",
    description: "Warehouse and transport operations for Madhesh region.",
    website: "https://janaklogistics.example",
    location: "Janakpur, Nepal",
  },
  {
    name: "Chitwan Hospitality Group",
    description: "Hotels and hospitality operations in central Nepal.",
    website: "https://chitwanhospitality.example",
    location: "Bharatpur, Nepal",
  },
  {
    name: "Karnali Connect",
    description: "Network and IT service provider for Karnali region.",
    website: "https://karnaliconnect.example",
    location: "Surkhet, Nepal",
  },
  {
    name: "Sudurpaschim Energy Services",
    description: "Power maintenance and field engineering services.",
    website: "https://sudurenergy.example",
    location: "Dhangadhi, Nepal",
  },
  {
    name: "Bhaktapur Craft Commerce",
    description: "E-commerce and retail systems for local producers.",
    website: "https://bhaktapurcraft.example",
    location: "Bhaktapur, Nepal",
  },
  {
    name: "Itahari Retail Tech",
    description: "Retail software systems and point-of-sale products.",
    website: "https://itahariretail.example",
    location: "Itahari, Nepal",
  },
  {
    name: "Bagmati Manufacturing Ltd",
    description: "Manufacturing operations and enterprise IT in Hetauda.",
    website: "https://bagmatimfg.example",
    location: "Hetauda, Nepal",
  },
  {
    name: "Midwest Logistics Nepal",
    description: "Transport, fleet, and warehouse management in western Nepal.",
    website: "https://midwestlogistics.example",
    location: "Nepalgunj, Nepal",
  },
  {
    name: "Dharan EdTech Hub",
    description: "Education technology products and online learning services.",
    website: "https://dharanedtech.example",
    location: "Dharan, Nepal",
  },
];

const jobTemplates = [
  {
    title: "Frontend Developer",
    description: "Build and maintain responsive user interfaces for web portals.",
    requirements: ["React", "JavaScript", "CSS", "REST APIs"],
    baseSalary: 85000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 2,
  },
  {
    title: "Backend Developer",
    description: "Develop backend APIs and maintain secure database services.",
    requirements: ["Node.js", "Express", "MongoDB", "API Design"],
    baseSalary: 95000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 3,
  },
  {
    title: "Full Stack Developer",
    description: "Deliver end-to-end features across frontend and backend systems.",
    requirements: ["React", "Node.js", "MongoDB", "Git"],
    baseSalary: 98000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 3,
  },
  {
    title: "UI/UX Designer",
    description: "Design intuitive interfaces, wireframes, and interactive prototypes.",
    requirements: ["Figma", "Wireframing", "Prototyping", "Design Systems"],
    baseSalary: 78000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 2,
  },
  {
    title: "QA Engineer",
    description: "Execute manual and automation tests for web and API quality.",
    requirements: ["Testing", "Selenium", "API Testing", "Bug Tracking"],
    baseSalary: 72000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 2,
  },
  {
    title: "DevOps Engineer",
    description: "Manage CI/CD pipelines and deployment infrastructure.",
    requirements: ["Docker", "Linux", "CI/CD", "Cloud"],
    baseSalary: 110000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 4,
  },
  {
    title: "Data Analyst",
    description: "Prepare operational dashboards and business performance reports.",
    requirements: ["SQL", "Excel", "Power BI", "Statistics"],
    baseSalary: 76000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 2,
  },
  {
    title: "Mobile App Developer",
    description: "Build and optimize mobile app features and integrations.",
    requirements: ["Kotlin", "Android SDK", "REST APIs", "Git"],
    baseSalary: 90000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 3,
  },
  {
    title: "Network Administrator",
    description: "Maintain office networks, firewalls, and secure connectivity.",
    requirements: ["Networking", "Firewalls", "Linux", "Troubleshooting"],
    baseSalary: 78000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 3,
  },
  {
    title: "IT Support Technician",
    description: "Resolve daily technical issues for employees and clients.",
    requirements: ["IT Support", "Hardware", "Windows", "Communication"],
    baseSalary: 52000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 1,
  },
  {
    title: "Operations Coordinator",
    description: "Coordinate day-to-day operations and maintain workflow records.",
    requirements: ["Operations", "MS Excel", "Coordination", "Reporting"],
    baseSalary: 58000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 2,
  },
  {
    title: "Business Development Officer",
    description: "Grow partnerships, follow leads, and support new business growth.",
    requirements: ["Sales", "Communication", "Client Management", "Reporting"],
    baseSalary: 68000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 2,
  },
  {
    title: "Sales Executive",
    description: "Handle field sales, retailer onboarding, and territory coverage.",
    requirements: ["Sales", "Negotiation", "MS Excel", "Reporting"],
    baseSalary: 55000,
    jobType: "Full Time",
    position: 3,
    experienceLevel: 1,
  },
  {
    title: "Customer Support Associate",
    description: "Support customers through calls, chat, and support tickets.",
    requirements: ["Customer Service", "Communication", "CRM", "Problem Solving"],
    baseSalary: 48000,
    jobType: "Full Time",
    position: 3,
    experienceLevel: 1,
  },
  {
    title: "HR Assistant",
    description: "Maintain employee records and assist day-to-day HR operations.",
    requirements: ["HR Basics", "MS Office", "Coordination", "Communication"],
    baseSalary: 50000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 1,
  },
  {
    title: "Junior Accountant",
    description: "Handle bookkeeping entries and monthly accounting support.",
    requirements: ["Accounting", "Tally", "Excel", "Bookkeeping"],
    baseSalary: 52000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 1,
  },
  {
    title: "Procurement Officer",
    description: "Manage purchasing workflows and vendor coordination.",
    requirements: ["Procurement", "Vendor Management", "Negotiation", "Documentation"],
    baseSalary: 62000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 2,
  },
  {
    title: "Digital Marketing Executive",
    description: "Run digital campaigns and optimize growth funnels.",
    requirements: ["Social Media", "Ads", "Content Writing", "Analytics"],
    baseSalary: 62000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 2,
  },
  {
    title: "Content Writer",
    description: "Create clear content for products, campaigns, and user guides.",
    requirements: ["Writing", "SEO", "Research", "Editing"],
    baseSalary: 48000,
    jobType: "Full Time",
    position: 2,
    experienceLevel: 1,
  },
  {
    title: "Warehouse Assistant",
    description: "Support warehouse receiving, packing, and stock counting.",
    requirements: ["Warehouse", "Inventory", "Teamwork", "Attention to Detail"],
    baseSalary: 42000,
    jobType: "Full Time",
    position: 3,
    experienceLevel: 0,
  },
  {
    title: "Logistics Supervisor",
    description: "Supervise routing, dispatch operations, and shipment tracking.",
    requirements: ["Logistics", "Dispatch", "Team Handling", "Reporting"],
    baseSalary: 70000,
    jobType: "Full Time",
    position: 1,
    experienceLevel: 3,
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const arraysEqual = (first = [], second = []) =>
  first.length === second.length && first.every((item, index) => item === second[index]);

const shouldUpdateJob = (existingJob, payload) =>
  existingJob.title !== payload.title ||
  existingJob.description !== payload.description ||
  !arraysEqual(existingJob.requirements, payload.requirements) ||
  String(existingJob.salary) !== String(payload.salary) ||
  existingJob.location !== payload.location ||
  existingJob.jobType !== payload.jobType ||
  Number(existingJob.postingDurationDays || 30) !== Number(payload.postingDurationDays) ||
  Number(existingJob.position) !== Number(payload.position) ||
  Number(existingJob.experienceLevel) !== Number(payload.experienceLevel) ||
  String(existingJob.company) !== String(payload.company) ||
  String(existingJob.created_by) !== String(payload.created_by) ||
  existingJob.seedKey !== payload.seedKey;

const buildJobSeeds = () =>
  companySeeds.flatMap((company, companyIndex) => {
    const startIndex = (companyIndex * JOBS_PER_COMPANY) % jobTemplates.length;

    return Array.from({ length: JOBS_PER_COMPANY }, (_, slotIndex) => {
      const template = jobTemplates[(startIndex + slotIndex) % jobTemplates.length];
      const salary = String(template.baseSalary + (companyIndex % 4) * 2500 + slotIndex * 500);
      const ordinal = slotIndex + 1;

      return {
        title: template.title,
        description: template.description,
        requirements: template.requirements,
        salary,
        location: company.location,
        jobType: template.jobType,
        position: template.position,
        experienceLevel: template.experienceLevel,
        companyName: company.name,
        seedKey: `${slugify(company.name)}-${slugify(template.title)}-${ordinal}`,
      };
    });
  });

const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) return;
  await connectDB();
};

export const ensureSuperAdmin = async () => {
  let superAdmin = await User.findOne({
    $or: [{ username: superAdminSeed.username }, { email: superAdminSeed.email }],
  });

  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminSeed.password, 10);
    superAdmin = await User.create({
      fullname: superAdminSeed.fullname,
      username: superAdminSeed.username,
      email: superAdminSeed.email,
      phoneNumber: superAdminSeed.phoneNumber,
      password: hashedPassword,
      role: superAdminSeed.role,
    });
    console.log("Created super admin account:", superAdmin.username);
    return superAdmin;
  }

  let shouldSave = false;
  if (!superAdmin.username || superAdmin.username !== superAdminSeed.username) {
    superAdmin.username = superAdminSeed.username;
    shouldSave = true;
  }
  if (superAdmin.role !== superAdminSeed.role) {
    superAdmin.role = superAdminSeed.role;
    shouldSave = true;
  }
  if (shouldSave) {
    await superAdmin.save();
    console.log("Updated super admin account:", superAdmin.username);
  } else {
    console.log("Super admin already exists:", superAdmin.username);
  }

  return superAdmin;
};

export const seedJobs = async ({
  closeConnection = false,
  minimumJobs = MINIMUM_SEEDED_JOBS,
  onlyWhenBelowMinimum = false,
} = {}) => {
  try {
    await ensureConnection();
    const superAdmin = await ensureSuperAdmin();

    const totalJobsBefore = await Job.countDocuments();
    if (onlyWhenBelowMinimum && totalJobsBefore >= minimumJobs) {
      console.log(`Seed skipped. ${totalJobsBefore} jobs already exist.`);
      return {
        insertedJobs: 0,
        updatedJobs: 0,
        skippedJobs: 0,
        totalJobs: totalJobsBefore,
      };
    }

    let recruiter = await User.findOne({ email: recruiterSeed.email });
    if (!recruiter) {
      const hashedPassword = await bcrypt.hash(recruiterSeed.password, 10);
      recruiter = await User.create({
        fullname: recruiterSeed.fullname,
        email: recruiterSeed.email,
        phoneNumber: recruiterSeed.phoneNumber,
        password: hashedPassword,
        role: recruiterSeed.role,
      });
      console.log("Created recruiter account:", recruiter.email);
    } else {
      console.log("Recruiter already exists:", recruiter.email);
    }

    const companiesByName = new Map();
    for (const companySeed of companySeeds) {
      let company = await Company.findOne({ name: companySeed.name });
      if (!company) {
        company = await Company.create({
          ...companySeed,
          userId: [recruiter._id],
          approvalStatus: "approved",
          approvalNote: "Auto-approved seed company",
          reviewedBy: superAdmin?._id || null,
          reviewedAt: new Date(),
        });
        console.log("Created company:", company.name);
      } else {
        company.description = companySeed.description;
        company.website = companySeed.website;
        company.location = companySeed.location;
        company.userId = Array.isArray(company.userId) ? company.userId : [];
        const recruiterExists = company.userId.find((id) => String(id) === String(recruiter._id));
        if (!recruiterExists) {
          company.userId.push(recruiter._id);
        }
        company.approvalStatus = "approved";
        company.approvalNote = "Auto-approved seed company";
        company.reviewedBy = superAdmin?._id || company.reviewedBy || null;
        company.reviewedAt = new Date();
        await company.save();
      }
      companiesByName.set(company.name, company);
    }

    const jobSeeds = buildJobSeeds();
    let insertedJobs = 0;
    let updatedJobs = 0;
    let skippedJobs = 0;

    for (const jobSeed of jobSeeds) {
      const company = companiesByName.get(jobSeed.companyName);
      if (!company) continue;

      const payload = {
        title: jobSeed.title,
        description: jobSeed.description,
        requirements: jobSeed.requirements,
        salary: jobSeed.salary,
        location: jobSeed.location,
        jobType: jobSeed.jobType,
        postingDurationDays: 30,
        position: jobSeed.position,
        company: company._id,
        experienceLevel: jobSeed.experienceLevel,
        created_by: recruiter._id,
        seedKey: jobSeed.seedKey,
      };

      let existingJob = await Job.findOne({ seedKey: jobSeed.seedKey });

      if (!existingJob) {
        existingJob = await Job.findOne({
          title: jobSeed.title,
          company: company._id,
          location: jobSeed.location,
          created_by: recruiter._id,
        });
      }

      if (!existingJob) {
        await Job.create(payload);
        insertedJobs += 1;
        continue;
      }

      if (shouldUpdateJob(existingJob, payload)) {
        existingJob.set(payload);
        await existingJob.save();
        updatedJobs += 1;
      } else {
        skippedJobs += 1;
      }
    }

    const totalJobs = await Job.countDocuments();
    console.log(
      `Seed complete. Inserted ${insertedJobs}, updated ${updatedJobs}, skipped ${skippedJobs}. Total jobs: ${totalJobs}.`
    );

    if (totalJobs < minimumJobs) {
      console.warn(
        `Warning: total jobs (${totalJobs}) is below minimum target (${minimumJobs}).`
      );
    }

    return {
      insertedJobs,
      updatedJobs,
      skippedJobs,
      totalJobs,
    };
  } catch (error) {
    console.error("Seeding failed:", error.message);
    throw error;
  } finally {
    if (closeConnection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

const currentFilePath = fileURLToPath(import.meta.url);
const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === currentFilePath;

if (isDirectExecution) {
  seedJobs({ closeConnection: true }).catch(() => {
    process.exitCode = 1;
  });
}
