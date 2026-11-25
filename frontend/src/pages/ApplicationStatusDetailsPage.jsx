import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarCheck2, CalendarClock, BriefcaseBusiness, Building2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate, formatDateTime } from "@/lib/formatters";

const statusClasses = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const ApplicationStatusDetailsPage = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/application/details/${id}`);
        setApplication(response.data?.application || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load application details"));
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [id]);

  const status = String(application?.status || "pending").toLowerCase();
  const company = application?.job?.company;
  const timeline = useMemo(
    () => [
      {
        label: "Application Submitted",
        value: formatDateTime(application?.createdAt),
      },
      {
        label: "Latest Status Update",
        value: formatDateTime(application?.updatedAt),
      },
      {
        label: "Interview Date",
        value: formatDateTime(application?.interviewDate),
      },
    ],
    [application]
  );

  if (loading) {
    return <p className="text-sm text-slate-600">Loading application details...</p>;
  }

  if (!application) {
    return <EmptyState title="Application not found" description="This application detail is unavailable." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          eyebrow="Application Details"
          title={application?.job?.title || "Applied Role"}
          description="See your current status, interview schedule, and related company details."
          actions={
            <Link to="/applications">
              <Button variant="outline">Back to Applications</Button>
            </Link>
          }
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current Status</h3>
            <span
              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[status] || statusClasses.pending}`}
            >
              {status}
            </span>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-slate-500" /> {application?.job?.jobType || "N/A"}
              </p>
              <p className="inline-flex items-center gap-2">
                <CalendarCheck2 className="h-4 w-4 text-slate-500" /> Applied {formatDate(application?.createdAt)}
              </p>
              <p className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-slate-500" /> Interview {formatDateTime(application?.interviewDate)}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Company</h3>
            <p className="mt-2 text-base font-semibold text-slate-900">{company?.name || "Company"}</p>
            <p className="text-sm text-slate-600">{application?.job?.location || "Location N/A"}</p>
            {company?._id && (
              <div className="mt-3">
                <Link to={`/companies/${company._id}`}>
                  <Button variant="outline" size="sm">
                    <Building2 className="mr-2 h-4 w-4" />
                    View Company Profile
                  </Button>
                </Link>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Status Timeline</h2>
        <div className="mt-4 space-y-3">
          {timeline.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3"
            >
              <p className="text-sm font-medium text-slate-700">{item.label}</p>
              <p className="text-sm text-slate-600">{item.value}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-6 text-lg font-semibold text-slate-900">Recruiter Note</h3>
        <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
          <Info className="h-4 w-4 text-slate-500" />
          {application?.statusNote || "No additional note shared yet."}
        </p>
      </section>
    </div>
  );
};

export default ApplicationStatusDetailsPage;
