import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { normalizeRoleLabel } from "@/utils/data";

const SECTION_KEYS = {
  OVERVIEW: "overview",
  USERS: "users",
  COMPANIES: "companies",
  JOBS: "jobs",
  APPLICATIONS: "applications",
};

const SEARCH_PLACEHOLDER = {
  [SECTION_KEYS.USERS]: "Search users by name, email, or username",
  [SECTION_KEYS.COMPANIES]: "Search companies by name or location",
  [SECTION_KEYS.JOBS]: "Search jobs by title, location, or company",
  [SECTION_KEYS.APPLICATIONS]: "Search applications by applicant, job, or company",
};

const companyStatusLabel = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

const companyStatusClass = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "approved") return "bg-emerald-100 text-emerald-700";
  if (normalized === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

const SuperAdminDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState(SECTION_KEYS.OVERVIEW);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, usersResponse, companiesResponse, jobsResponse, applicationsResponse] =
        await Promise.all([
          apiClient.get("/admin/dashboard"),
          apiClient.get("/admin/users"),
          apiClient.get("/admin/companies"),
          apiClient.get("/admin/jobs"),
          apiClient.get("/admin/applications"),
        ]);

      const dashboardData = dashboardResponse.data?.dashboard || null;
      const usersData = usersResponse.data?.users || [];
      const companiesData = companiesResponse.data?.companies || [];
      const jobsData = jobsResponse.data?.jobs || [];
      const applicationsData = applicationsResponse.data?.applications || [];

      setDashboard(dashboardData);
      setUsers(usersData);
      setCompanies(companiesData);
      setJobs(jobsData);
      setApplications(applicationsData);

      const draftValues = {};
      applicationsData.forEach((application) => {
        draftValues[application._id] = String(application.status || "pending").toLowerCase();
      });
      setStatusDrafts(draftValues);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not load super admin dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return users;
    return users.filter((user) => {
      return (
        String(user.fullname || "").toLowerCase().includes(value) ||
        String(user.email || "").toLowerCase().includes(value) ||
        String(user.username || "").toLowerCase().includes(value)
      );
    });
  }, [users, query]);

  const filteredCompanies = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return companies;
    return companies.filter((company) => {
      return (
        String(company.name || "").toLowerCase().includes(value) ||
        String(company.location || "").toLowerCase().includes(value)
      );
    });
  }, [companies, query]);

  const filteredJobs = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return jobs;
    return jobs.filter((job) => {
      return (
        String(job.title || "").toLowerCase().includes(value) ||
        String(job.location || "").toLowerCase().includes(value) ||
        String(job.company?.name || "").toLowerCase().includes(value)
      );
    });
  }, [jobs, query]);

  const filteredApplications = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return applications;
    return applications.filter((application) => {
      return (
        String(application.applicant?.fullname || "").toLowerCase().includes(value) ||
        String(application.job?.title || "").toLowerCase().includes(value) ||
        String(application.job?.company?.name || "").toLowerCase().includes(value)
      );
    });
  }, [applications, query]);

  const isBusy = (key) => actionKey === key;

  const runAction = async (key, request, successMessage) => {
    try {
      setActionKey(key);
      await request();
      toast.success(successMessage);
      await fetchAllData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Action failed"));
    } finally {
      setActionKey("");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user and related records?")) return;
    await runAction(
      `delete-user-${userId}`,
      () => apiClient.delete(`/admin/users/${userId}`),
      "User deleted"
    );
  };

  const deleteCompany = async (companyId) => {
    if (!window.confirm("Delete this company and all jobs under it?")) return;
    await runAction(
      `delete-company-${companyId}`,
      () => apiClient.delete(`/admin/companies/${companyId}`),
      "Company deleted"
    );
  };

  const reviewCompany = async (companyId, status) => {
    const note =
      status === "rejected"
        ? window.prompt("Optional rejection note for recruiter:", "") || ""
        : "";
    await runAction(
      `review-company-${status}-${companyId}`,
      () =>
        apiClient.patch(`/admin/companies/${companyId}/review`, {
          status,
          note,
        }),
      `Company ${status}`
    );
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Delete this job and all linked applications?")) return;
    await runAction(
      `delete-job-${jobId}`,
      () => apiClient.delete(`/admin/jobs/${jobId}`),
      "Job deleted"
    );
  };

  const updateApplicationStatus = async (applicationId) => {
    const status = statusDrafts[applicationId] || "pending";
    await runAction(
      `status-application-${applicationId}`,
      () =>
        apiClient.patch(`/admin/applications/${applicationId}/status`, {
          status,
        }),
      "Application status updated"
    );
  };

  const deleteApplication = async (applicationId) => {
    if (!window.confirm("Delete this application?")) return;
    await runAction(
      `delete-application-${applicationId}`,
      () => apiClient.delete(`/admin/applications/${applicationId}`),
      "Application deleted"
    );
  };

  const counts = dashboard?.counts || {};
  const statCards = [
    {
      label: "Users",
      value: counts.totalUsers ?? 0,
      helper: `${counts.totalSuperAdmins ?? 0} super admins`,
      icon: <Users className="h-5 w-5 text-blue-600" />,
    },
    {
      label: "Companies",
      value: counts.totalCompanies ?? 0,
      helper: `${counts.pendingCompanies ?? 0} pending approval`,
      icon: <Building2 className="h-5 w-5 text-blue-600" />,
    },
    {
      label: "Jobs",
      value: counts.totalJobs ?? 0,
      helper: "Active job posts",
      icon: <BriefcaseBusiness className="h-5 w-5 text-blue-600" />,
    },
    {
      label: "Applications",
      value: counts.totalApplications ?? 0,
      helper: `${counts.pendingApplications ?? 0} pending`,
      icon: <FileText className="h-5 w-5 text-blue-600" />,
    },
  ];

  const sectionTabs = [
    { key: SECTION_KEYS.OVERVIEW, label: "Overview" },
    { key: SECTION_KEYS.USERS, label: `Users (${users.length})` },
    { key: SECTION_KEYS.COMPANIES, label: `Companies (${companies.length})` },
    { key: SECTION_KEYS.JOBS, label: `Jobs (${jobs.length})` },
    { key: SECTION_KEYS.APPLICATIONS, label: `Applications (${applications.length})` },
  ];

  const showSearch = activeSection !== SECTION_KEYS.OVERVIEW;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          eyebrow="Super Admin"
          title="Platform Control Center"
          description="Use sections to manage one area at a time."
          actions={
            <Button
              variant="outline"
              onClick={fetchAllData}
              disabled={loading}
              className="border-slate-300"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {sectionTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveSection(tab.key);
                setQuery("");
              }}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeSection === tab.key
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {showSearch ? (
          <div className="mt-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={SEARCH_PLACEHOLDER[activeSection]}
              className="max-w-xl"
            />
          </div>
        ) : null}
      </section>

      {activeSection === SECTION_KEYS.OVERVIEW ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ label, value, helper, icon }) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{label}</p>
                    <p className="text-2xl font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{helper}</p>
                  </div>
                  {icon}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6">
            <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Recent Activity
            </h2>

            {!dashboard && !loading ? (
              <EmptyState
                title="No dashboard data available"
                description="Try refreshing to load recent activity."
              />
            ) : null}

            {dashboard ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">Recent Users</p>
                  <div className="mt-2 space-y-2">
                    {(dashboard.recent?.users || []).map((user) => (
                      <div key={user._id} className="text-sm text-slate-700">
                        {user.fullname} ({normalizeRoleLabel(user.role)}) - {formatDate(user.createdAt)}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">Recent Applications</p>
                  <div className="mt-2 space-y-2">
                    {(dashboard.recent?.applications || []).map((application) => (
                      <div key={application._id} className="text-sm text-slate-700">
                        {application.applicant?.fullname || "Applicant"} - {application.job?.title || "Job"} (
                        {application.status})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeSection === SECTION_KEYS.USERS ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Users</h2>
          {!loading && filteredUsers.length === 0 ? (
            <EmptyState title="No users found" description="Try a different search term." />
          ) : null}
          {filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.slice(0, 25).map((user) => (
                <article key={user._id} className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{user.fullname}</p>
                      <p className="text-sm text-slate-600">
                        {user.username ? `${user.username} | ` : ""}
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        {normalizeRoleLabel(user.role)} - Joined {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user._id)}
                      disabled={isBusy(`delete-user-${user._id}`)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeSection === SECTION_KEYS.COMPANIES ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Companies</h2>
          {!loading && filteredCompanies.length === 0 ? (
            <EmptyState title="No companies found" description="Try a different search term." />
          ) : null}
          {filteredCompanies.length > 0 ? (
            <div className="space-y-3">
              {filteredCompanies.slice(0, 25).map((company) => (
                <article key={company._id} className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {company.name} ({company.totalJobs || 0} jobs)
                      </p>
                      <p className="text-sm text-slate-600">{company.location || "N/A"}</p>
                      <p className="mt-1">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${companyStatusClass(
                            company.approvalStatus
                          )}`}
                        >
                          {companyStatusLabel(company.approvalStatus)}
                        </span>
                      </p>
                      {company.approvalNote ? (
                        <p className="mt-1 text-xs text-slate-600">Note: {company.approvalNote}</p>
                      ) : null}
                      <p className="text-xs text-slate-500">Created {formatDate(company.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {String(company.approvalStatus || "pending").toLowerCase() !== "approved" ? (
                        <Button
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={() => reviewCompany(company._id, "approved")}
                          disabled={isBusy(`review-company-approved-${company._id}`)}
                        >
                          Approve
                        </Button>
                      ) : null}
                      {String(company.approvalStatus || "pending").toLowerCase() !== "rejected" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-300 text-rose-700 hover:bg-rose-50"
                          onClick={() => reviewCompany(company._id, "rejected")}
                          disabled={isBusy(`review-company-rejected-${company._id}`)}
                        >
                          Reject
                        </Button>
                      ) : null}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCompany(company._id)}
                        disabled={isBusy(`delete-company-${company._id}`)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeSection === SECTION_KEYS.JOBS ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Jobs</h2>
          {!loading && filteredJobs.length === 0 ? (
            <EmptyState title="No jobs found" description="Try a different search term." />
          ) : null}
          {filteredJobs.length > 0 ? (
            <div className="space-y-3">
              {filteredJobs.slice(0, 25).map((job) => (
                <article key={job._id} className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-600">
                        {job.company?.name || "Company"} | {job.location}
                      </p>
                      <p className="text-xs text-slate-500">
                        Posted {formatDate(job.createdAt)} by {job.created_by?.fullname || "Unknown"}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteJob(job._id)}
                      disabled={isBusy(`delete-job-${job._id}`)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {activeSection === SECTION_KEYS.APPLICATIONS ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Applications</h2>
          {!loading && filteredApplications.length === 0 ? (
            <EmptyState title="No applications found" description="Try a different search term." />
          ) : null}
          {filteredApplications.length > 0 ? (
            <div className="space-y-3">
              {filteredApplications.slice(0, 30).map((application) => (
                <article key={application._id} className="rounded-2xl border border-slate-200 bg-slate-50/30 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {application.applicant?.fullname || "Applicant"} - {application.job?.title || "Job"}
                      </p>
                      <p className="text-sm text-slate-600">
                        {application.job?.company?.name || "Company"} | Applied {formatDate(application.createdAt)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Current status: {application.status} | Interview: {formatDateTime(application.interviewDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={statusDrafts[application._id] || "pending"}
                        onChange={(event) =>
                          setStatusDrafts((previous) => ({
                            ...previous,
                            [application._id]: event.target.value,
                          }))
                        }
                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                      >
                        <option value="pending">pending</option>
                        <option value="accepted">accepted</option>
                        <option value="rejected">rejected</option>
                      </select>
                      <Button
                        size="sm"
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => updateApplicationStatus(application._id)}
                        disabled={isBusy(`status-application-${application._id}`)}
                      >
                        Update
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteApplication(application._id)}
                        disabled={isBusy(`delete-application-${application._id}`)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
};

export default SuperAdminDashboardPage;
