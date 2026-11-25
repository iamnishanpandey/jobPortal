import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Building2,
  CalendarDays,
  MapPin,
  BadgeDollarSign,
  BriefcaseBusiness,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import {
  formatCurrency,
  formatDate,
  formatPostingEndDate,
  isPostingClosed,
} from "@/lib/formatters";
import { isApplicantRole } from "@/utils/data";

const JobDetailsPage = () => {
  const { id } = useParams();
  const { user } = useSelector((store) => store.auth);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/job/get/${id}`);
        setJob(response.data?.job || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load job details"));
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, user]);

  const applyToJob = async () => {
    if (job && isPostingClosed(job.createdAt, job.postingDurationDays)) {
      toast.error(
        `This job posting ended on ${formatPostingEndDate(job.createdAt, job.postingDurationDays)}`
      );
      return;
    }

    try {
      setApplying(true);
      const response = await apiClient.get(`/application/apply/${id}`);
      toast.success(response.data?.message || "Application submitted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not apply to this job"));
    } finally {
      setApplying(false);
    }
  };

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState
          title="Sign in required"
          description="Job details are available only to authenticated users in your current backend."
        />
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/signin">
            <Button>Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="outline">Create Account</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-600">Loading job details...</p>;
  }

  if (!job) {
    return <EmptyState title="Job not found" description="This role may have been removed." />;
  }

  const companyName =
    typeof job.company === "object" && job.company !== null ? job.company.name : job.company;
  const companyId =
    typeof job.company === "object" && job.company !== null ? job.company._id : job.company;
  const postingClosed = isPostingClosed(job.createdAt, job.postingDurationDays);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{job.title}</h1>
            <p className="mt-1 text-sm text-slate-600">{job.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {companyId && isApplicantRole(user.role) && (
              <Link to={`/companies/${companyId}`}>
                <Button variant="outline">Company Profile</Button>
              </Link>
            )}
            {isApplicantRole(user.role) && (
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={applyToJob}
                disabled={applying || postingClosed}
              >
                {postingClosed ? "Posting Ended" : applying ? "Applying..." : "Apply Now"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-3">
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <MapPin className="h-4 w-4 text-slate-500" /> {job.location}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <BadgeDollarSign className="h-4 w-4 text-slate-500" /> {formatCurrency(job.salary)}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <BriefcaseBusiness className="h-4 w-4 text-slate-500" /> {job.jobType}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Building2 className="h-4 w-4 text-slate-500" /> {companyName || "Company"}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-slate-500" /> Posted {formatDate(job.createdAt)}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Timer className="h-4 w-4 text-slate-500" /> {postingClosed ? "Ended" : "Ends"}{" "}
            {formatPostingEndDate(job.createdAt, job.postingDurationDays)}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            Experience: {job.experienceLevel} year(s)
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Requirements</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {(job.requirements ?? []).map((requirement, index) => (
            <span
              key={`${job._id}-requirement-${index}`}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {requirement}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

export default JobDetailsPage;
