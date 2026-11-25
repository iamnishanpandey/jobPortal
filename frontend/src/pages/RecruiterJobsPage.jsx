import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PlusCircle, UsersRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate, formatPostingEndDate, isPostingClosed } from "@/lib/formatters";

const RecruiterJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/job/getadminjobs");
        setJobs(response.data?.jobs || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load recruiter jobs"));
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    if (!keyword.trim()) return jobs;
    const value = keyword.toLowerCase();
    return jobs.filter((job) => {
      return (
        String(job.title || "").toLowerCase().includes(value) ||
        String(job.location || "").toLowerCase().includes(value) ||
        String(job.company?.name || "").toLowerCase().includes(value)
      );
    });
  }, [jobs, keyword]);

  const deleteJob = async (jobId, jobTitle) => {
    if (!jobId) return;
    const shouldDelete = window.confirm(
      `Delete "${jobTitle || "this job"}"? This will also remove all related applications.`
    );
    if (!shouldDelete) return;

    try {
      setDeletingJobId(jobId);
      const response = await apiClient.delete(`/job/${jobId}`);
      toast.success(response.data?.message || "Job deleted");
      setJobs((previous) => previous.filter((job) => job._id !== jobId));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete this job"));
    } finally {
      setDeletingJobId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          eyebrow="Recruiter Dashboard"
          title="Manage Posted Jobs"
          description="Track all jobs you have posted and review applicants by role."
          actions={
            <Link to="/recruiter/jobs/create">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" /> Post Job
              </Button>
            </Link>
          }
        />

        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Search by title, company, or location"
          className="max-w-md"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {loading && <p className="text-sm text-slate-600">Loading posted jobs...</p>}

        {!loading && filteredJobs.length === 0 && (
          <EmptyState
            title="No posted jobs found"
            description="Create a job first or adjust your search term."
          />
        )}

        {!loading && filteredJobs.length > 0 && (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const postingClosed = isPostingClosed(job.createdAt, job.postingDurationDays);

              return (
                <article key={job._id} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-600">
                        {job.company?.name || "Company"} | {job.location} | {job.jobType}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Posted {formatDate(job.createdAt)} | {postingClosed ? "Ended" : "Ends"}{" "}
                        {formatPostingEndDate(job.createdAt, job.postingDurationDays)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {job.applications?.length || 0} applicants
                      </span>
                      <Link to={`/recruiter/jobs/${job._id}/applicants`}>
                        <Button variant="outline" size="sm">
                          <UsersRound className="mr-2 h-4 w-4" />
                          View Applicants
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteJob(job._id, job.title)}
                        disabled={deletingJobId === job._id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingJobId === job._id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default RecruiterJobsPage;
