import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { isFutureDateInput, trimText } from "@/lib/validation";
import { normalizeRoleLabel } from "@/utils/data";

const statusClasses = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  accepted: "bg-emerald-50 border-emerald-200 text-emerald-700",
  rejected: "bg-rose-50 border-rose-200 text-rose-700",
};

const toDateTimeLocalValue = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const timezoneOffsetMs = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
};

const ApplicantsPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [interviewDrafts, setInterviewDrafts] = useState({});
  const [statusNoteDrafts, setStatusNoteDrafts] = useState({});

  const seedDraftsFromApplications = (applications = []) => {
    const nextInterviewDrafts = {};
    const nextNoteDrafts = {};
    applications.forEach((application) => {
      nextInterviewDrafts[application._id] = toDateTimeLocalValue(application?.interviewDate);
      nextNoteDrafts[application._id] = application?.statusNote || "";
    });
    setInterviewDrafts(nextInterviewDrafts);
    setStatusNoteDrafts(nextNoteDrafts);
  };

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/application/${id}/applicants`);
      const jobData = response.data?.job || null;
      setJob(jobData);
      seedDraftsFromApplications(jobData?.applications || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not load applicants"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const updateStatus = async (applicationId, status, extraPayload = {}, successMessage = "") => {
    try {
      setUpdatingId(applicationId);
      const response = await apiClient.post(`/application/status/${applicationId}/update`, {
        status,
        ...extraPayload,
      });
      toast.success(successMessage || response.data?.message || "Status updated");
      fetchApplicants();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update status"));
    } finally {
      setUpdatingId("");
    }
  };

  const saveInterviewDetails = (applicationId, status) => {
    const interviewDate = interviewDrafts[applicationId] || "";
    const statusNote = trimText(statusNoteDrafts[applicationId] || "");

    if (statusNote.length > 500) {
      toast.error("Status note cannot exceed 500 characters");
      return;
    }
    if (!isFutureDateInput(interviewDate)) {
      toast.error("Interview date must be in the future");
      return;
    }

    updateStatus(
      applicationId,
      status,
      {
        interviewDate,
        statusNote,
      },
      "Interview details updated"
    );
  };

  const filteredApplicants = useMemo(() => {
    const applications = job?.applications || [];
    const query = search.toLowerCase().trim();
    if (!query) return applications;
    return applications.filter((application) => {
      return (
        String(application?.applicant?.fullname || "").toLowerCase().includes(query) ||
        String(application?.applicant?.email || "").toLowerCase().includes(query)
      );
    });
  }, [job, search]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading applicants...</p>;
  }

  if (!job) {
    return <EmptyState title="Job not found" description="Unable to load applicants for this role." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          eyebrow="Recruiter"
          title={`Applicants: ${job.title}`}
          description="Review candidates and update their application status."
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search applicant by name or email"
          className="max-w-md"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {filteredApplicants.length === 0 && (
          <EmptyState
            title="No applicants found"
            description="Applications will appear here once candidates apply."
          />
        )}

        {filteredApplicants.length > 0 && (
          <div className="space-y-3">
            {filteredApplicants.map((application) => {
              const applicant = application.applicant || {};
              const status = String(application.status || "pending").toLowerCase();
              const applicantSkills = applicant?.profile?.skills || [];
              const applicantBio = applicant?.profile?.bio;
              const applicantResume = applicant?.profile?.resume;
              const applicantResumeName = applicant?.profile?.resumeOriginalName || "Resume";

              return (
                <article key={application._id} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{applicant.fullname || "Applicant"}</h3>
                      <p className="text-sm text-slate-600">{applicant.email || "No email"}</p>
                      <p className="text-sm text-slate-600">{applicant.phoneNumber || "No phone number"}</p>
                      <p className="text-xs text-slate-500">{normalizeRoleLabel(applicant.role || "Applicant")}</p>
                      <p className="mt-1 text-xs text-slate-500">Applied {formatDate(application.createdAt)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Interview: {formatDateTime(application.interviewDate)}
                      </p>
                      {application.statusNote && (
                        <p className="mt-2 text-sm text-slate-700">Note: {application.statusNote}</p>
                      )}
                      {applicantBio && <p className="mt-2 text-sm text-slate-700">Bio: {applicantBio}</p>}
                      {applicantSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {applicantSkills.map((skill) => (
                            <span
                              key={`${application._id}-${skill}`}
                              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      {applicantResume && (
                        <a
                          href={applicantResume}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800"
                        >
                          View Resume: {applicantResumeName}
                        </a>
                      )}
                    </div>
                    <div className="space-y-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[status] || statusClasses.pending}`}
                      >
                        {status}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/recruiter/applicants/${application._id}`}>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(application._id, "accepted")}
                          disabled={updatingId === application._id}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(application._id, "rejected")}
                          disabled={updatingId === application._id}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(application._id, "pending")}
                          disabled={updatingId === application._id}
                        >
                          Mark Pending
                        </Button>
                      </div>
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Interview Schedule
                        </p>
                        <Input
                          type="datetime-local"
                          value={interviewDrafts[application._id] || ""}
                          onChange={(event) =>
                            setInterviewDrafts((previous) => ({
                              ...previous,
                              [application._id]: event.target.value,
                            }))
                          }
                          disabled={updatingId === application._id}
                        />
                        <Input
                          value={statusNoteDrafts[application._id] || ""}
                          onChange={(event) =>
                            setStatusNoteDrafts((previous) => ({
                              ...previous,
                              [application._id]: event.target.value,
                            }))
                          }
                          placeholder="Status note for applicant (optional)"
                          disabled={updatingId === application._id}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveInterviewDetails(application._id, status)}
                          disabled={updatingId === application._id}
                        >
                          Save Interview Details
                        </Button>
                      </div>
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

export default ApplicantsPage;
