import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CalendarClock, CircleCheck, CircleX, LoaderCircle } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import SectionHeader from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatters";

const statusStyles = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusIcon = {
  pending: LoaderCircle,
  accepted: CircleCheck,
  rejected: CircleX,
};

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/application/get");
        setApplications(response.data?.application || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load applications"));
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <SectionHeader
        eyebrow="Applicant Dashboard"
        title="My Applications"
        description="Track the current status of all roles you have applied for."
        actions={
          <Link to="/jobs">
            <Button variant="outline">Find More Jobs</Button>
          </Link>
        }
      />

      {loading && <p className="text-sm text-slate-600">Loading applications...</p>}

      {!loading && applications.length === 0 && (
        <EmptyState
          title="No applications yet"
          description="Apply to jobs from the browse page to see your status updates here."
        />
      )}

      {!loading && applications.length > 0 && (
        <div className="space-y-3">
          {applications.map((application) => {
            const status = String(application.status || "pending").toLowerCase();
            const StatusIcon = statusIcon[status] || LoaderCircle;

            return (
              <article
                key={application._id}
                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {application?.job?.title || "Role unavailable"}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {application?.job?.location || "Location N/A"}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                      <CalendarClock className="h-3.5 w-3.5" /> Applied {formatDate(application.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.pending}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/applications/${application._id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      {application?.job?.company?._id && (
                        <Link to={`/companies/${application.job.company._id}`}>
                          <Button variant="outline" size="sm">
                            Company Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default ApplicationsPage;
