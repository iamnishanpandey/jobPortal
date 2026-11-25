import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { isIntegerInRange, parseCommaSeparated, trimText } from "@/lib/validation";

const CreateJobPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    salary: "",
    location: "",
    jobType: "",
    position: "",
    companyId: "",
    experience: "",
    postingDurationDays: "30",
  });
  const approvedCompanies = companies.filter(
    (company) => String(company.approvalStatus || "pending").toLowerCase() === "approved"
  );

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const response = await apiClient.get("/company/get");
        const results = response.data?.companies || [];
        setCompanies(results);
        const approvedResults = results.filter(
          (company) => String(company.approvalStatus || "pending").toLowerCase() === "approved"
        );
        if (approvedResults.length) {
          setForm((previous) => ({
            ...previous,
            companyId: previous.companyId || approvedResults[0]._id,
          }));
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load companies"));
      } finally {
        setLoadingCompanies(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = trimText(form.title);
    const description = trimText(form.description);
    const location = trimText(form.location);
    const jobType = trimText(form.jobType);
    const requirements = parseCommaSeparated(form.requirements);

    if (title.length < 2) {
      toast.error("Title must be at least 2 characters");
      return;
    }
    if (description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }
    if (!requirements.length) {
      toast.error("Add at least one requirement");
      return;
    }
    if (requirements.length > 30) {
      toast.error("Requirements cannot exceed 30 items");
      return;
    }
    if (!isIntegerInRange(form.salary, 1, 1000000000)) {
      toast.error("Salary must be a valid number greater than 0");
      return;
    }
    if (!isIntegerInRange(form.position, 1, 10000)) {
      toast.error("Open positions must be between 1 and 10000");
      return;
    }
    if (!isIntegerInRange(form.experience, 0, 50)) {
      toast.error("Experience must be between 0 and 50 years");
      return;
    }
    if (!isIntegerInRange(form.postingDurationDays, 1, 365)) {
      toast.error("Posting duration must be between 1 and 365 days");
      return;
    }
    if (location.length < 2) {
      toast.error("Location must be at least 2 characters");
      return;
    }
    if (jobType.length < 2) {
      toast.error("Job type must be at least 2 characters");
      return;
    }
    if (!trimText(form.companyId)) {
      toast.error("Company is required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post("/job/post", {
        ...form,
        title,
        description,
        location,
        jobType,
        postingDurationDays: Number(form.postingDurationDays),
        requirements: requirements.join(", "),
      });
      toast.success(response.data?.message || "Job posted");
      navigate("/recruiter/jobs");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not post job"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCompanies) {
    return <p className="text-sm text-slate-600">Loading companies...</p>;
  }

  if (!companies.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState
          title="Create a company first"
          description="A job post requires a company. Add one from the recruiter companies page."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate("/recruiter/companies")}>Go to Companies</Button>
        </div>
      </section>
    );
  }

  if (!approvedCompanies.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState
          title="Waiting for super admin approval"
          description="Your companies are pending approval. You can post jobs only after approval."
        />
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate("/recruiter/companies")}>Go to Companies</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <SectionHeader
        eyebrow="Recruiter"
        title="Create Job Post"
        description="Fill out the job details below to publish a new vacancy."
      />

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="companyId">Company</Label>
          <select
            id="companyId"
            name="companyId"
            value={form.companyId}
            onChange={handleChange}
            className="mt-2 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          >
            {approvedCompanies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="requirements">Requirements (comma separated)</Label>
          <Input
            id="requirements"
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            placeholder="React, Node.js, SQL"
            required
          />
        </div>
        <div>
          <Label htmlFor="salary">Salary</Label>
          <Input id="salary" name="salary" type="number" min="0" value={form.salary} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="position">Open Positions</Label>
          <Input
            id="position"
            name="position"
            type="number"
            min="1"
            value={form.position}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" value={form.location} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="jobType">Job Type</Label>
          <Input id="jobType" name="jobType" value={form.jobType} onChange={handleChange} placeholder="Full Time" required />
        </div>
        <div>
          <Label htmlFor="experience">Experience (years)</Label>
          <Input
            id="experience"
            name="experience"
            type="number"
            min="0"
            value={form.experience}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="postingDurationDays">Posting Duration (days)</Label>
          <Input
            id="postingDurationDays"
            name="postingDurationDays"
            type="number"
            min="1"
            max="365"
            value={form.postingDurationDays}
            onChange={handleChange}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>
            {submitting ? "Posting..." : "Publish Job"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default CreateJobPage;
