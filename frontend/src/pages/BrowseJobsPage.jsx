import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import JobCard from "@/components/jobs/JobCard";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { filterJobs, rankJobsByMatch } from "@/lib/algorithms";
import { isPostingClosed } from "@/lib/formatters";
import { toast } from "sonner";
import { isApplicantRole } from "@/utils/data";

const BrowseJobsPage = () => {
  const { user } = useSelector((store) => store.auth);
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(() => searchParams.get("keyword") || "");
  const [filters, setFilters] = useState({
    location: "",
    jobType: "",
    minSalary: "",
  });
  const [sortBy, setSortBy] = useState("match");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applyingId, setApplyingId] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/job/get", {
          params: { keyword },
        });
        setJobs(response.data?.jobs || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load jobs"));
      } finally {
        setLoading(false);
      }
    };

    const id = setTimeout(fetchJobs, 350);
    return () => clearTimeout(id);
  }, [keyword, user]);

  useEffect(() => {
    if (!user || !isApplicantRole(user.role)) return;

    const fetchAppliedJobs = async () => {
      try {
        const response = await apiClient.get("/application/get");
        const applications = response.data?.application || [];
        const ids = new Set(applications.map((item) => item?.job?._id).filter(Boolean));
        setAppliedJobIds(ids);
      } catch {
        // Keep UI functional even when applied-jobs endpoint fails.
      }
    };

    fetchAppliedJobs();
  }, [user]);

  const rankedJobs = useMemo(() => {
    const filtered = filterJobs(jobs, filters);
    const ranked = rankJobsByMatch(filtered, {
      user,
      keyword,
      preferences: filters,
    });

    if (sortBy === "salary") {
      return [...ranked].sort((a, b) => Number(b.salary || 0) - Number(a.salary || 0));
    }

    if (sortBy === "latest") {
      return [...ranked].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return ranked;
  }, [jobs, filters, keyword, sortBy, user]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((previous) => ({ ...previous, [name]: value }));
  };

  const applyToJob = async (jobId) => {
    if (!jobId || !isApplicantRole(user?.role)) return;

    try {
      setApplyingId(jobId);
      const response = await apiClient.get(`/application/apply/${jobId}`);
      toast.success(response.data?.message || "Application submitted");
      setAppliedJobIds((previous) => new Set(previous).add(jobId));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not submit application"));
    } finally {
      setApplyingId("");
    }
  };

  if (!user) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <EmptyState
          title="Authentication required"
          description="Your jobs API is protected. Sign in to browse and apply for jobs."
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

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-300 bg-white p-6 md:p-8">
        <SectionHeader
          eyebrow="Job Explorer"
          title="Browse Jobs"
          description="Use simple filters to quickly find jobs that fit you."
        />

        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Title, skill, or description"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </label>
            <Input
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="Remote / City"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Job Type
            </label>
            <Input
              name="jobType"
              value={filters.jobType}
              onChange={handleFilterChange}
              placeholder="Full Time"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Min Salary
            </label>
            <Input
              type="number"
              min="0"
              name="minSalary"
              value={filters.minSalary}
              onChange={handleFilterChange}
              placeholder="40000"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</p>
          <Button variant={sortBy === "match" ? "default" : "outline"} size="sm" onClick={() => setSortBy("match")}>
            Recommended
          </Button>
          <Button variant={sortBy === "latest" ? "default" : "outline"} size="sm" onClick={() => setSortBy("latest")}>
            Latest
          </Button>
          <Button variant={sortBy === "salary" ? "default" : "outline"} size="sm" onClick={() => setSortBy("salary")}>
            Highest Salary
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        {loading && <p className="text-sm text-slate-600">Loading jobs...</p>}

        {!loading && rankedJobs.length === 0 && (
          <EmptyState
            title="No jobs match your filters"
            description="Try broader criteria or clear one of the filters."
          />
        )}

        {rankedJobs.map((job) => {
          const alreadyApplied = appliedJobIds.has(job._id);
          const postingClosed = isPostingClosed(job.createdAt, job.postingDurationDays);
          const allowApply = isApplicantRole(user.role) && !alreadyApplied && !postingClosed;

          return (
            <JobCard
              key={job._id}
              job={job}
              onApply={allowApply ? applyToJob : undefined}
              applying={applyingId === job._id}
              showActions
            />
          );
        })}
      </section>
    </div>
  );
};

export default BrowseJobsPage;
