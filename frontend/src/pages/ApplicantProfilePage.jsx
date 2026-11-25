import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, Mail, Phone, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate, getInitials } from "@/lib/formatters";
import { normalizeRoleLabel } from "@/utils/data";

const statusClasses = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  accepted: "bg-emerald-50 border-emerald-200 text-emerald-700",
  rejected: "bg-rose-50 border-rose-200 text-rose-700",
};

const ApplicantProfilePage = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/application/profile/${id}`);
        setApplication(response.data?.application || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load applicant profile"));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const applicant = application?.applicant || {};
  const job = application?.job || {};
  const status = String(application?.status || "pending").toLowerCase();
  const skills = applicant?.profile?.skills || [];
  const initials = useMemo(() => getInitials(applicant?.fullname || "Applicant"), [applicant?.fullname]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading applicant profile...</p>;
  }

  if (!application) {
    return <EmptyState title="Applicant profile not found" description="This application may no longer exist." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          eyebrow="Recruiter"
          title={applicant?.fullname ? `${applicant.fullname} Profile` : "Applicant Profile"}
          description="Detailed applicant information for hiring decisions."
          actions={
            <Link to={`/recruiter/jobs/${job?._id}/applicants`}>
              <Button variant="outline">Back to Applicants</Button>
            </Link>
          }
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{applicant?.fullname || "Applicant"}</h2>
                <p className="text-sm text-slate-600">{normalizeRoleLabel(applicant?.role || "Applicant")}</p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[status] || statusClasses.pending}`}
                >
                  {status}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" /> {applicant?.email || "No email"}
              </p>
              <p className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" /> {applicant?.phoneNumber || "No phone number"}
              </p>
              <p className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" /> Applied {formatDate(application?.createdAt)}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-base font-semibold text-slate-900">Applied Job</h3>
            <p className="mt-2 text-sm text-slate-700">{job?.title || "Job"}</p>
            <p className="text-sm text-slate-600">
              {(job?.company && job.company.name) || "Company"} | {job?.location || "Location N/A"} |{" "}
              {job?.jobType || "N/A"}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h3 className="text-lg font-semibold text-slate-900">Professional Summary</h3>
        <p className="mt-2 text-sm text-slate-700">
          {applicant?.profile?.bio || "No bio provided by this applicant."}
        </p>

        <h3 className="mt-6 text-lg font-semibold text-slate-900">Skills</h3>
        {skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={`${application?._id}-${skill}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No skills listed.</p>
        )}

        <h3 className="mt-6 text-lg font-semibold text-slate-900">Resume</h3>
        {applicant?.profile?.resume ? (
          <a
            href={applicant.profile.resume}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            <UserCircle2 className="h-4 w-4" />
            {applicant?.profile?.resumeOriginalName || "View Resume"}
          </a>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No resume uploaded.</p>
        )}
      </section>
    </div>
  );
};

export default ApplicantProfilePage;
