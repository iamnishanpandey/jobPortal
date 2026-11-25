import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatters";
import { trimText } from "@/lib/validation";

const companyStatusLabel = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Pending Approval";
};

const companyStatusClass = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "approved") return "bg-emerald-100 text-emerald-700";
  if (normalized === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

const RecruiterCompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState("");

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/company/get");
      setCompanies(response.data?.companies || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not load companies"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const createCompany = async (event) => {
    event.preventDefault();
    const normalizedCompanyName = trimText(companyName);
    if (!normalizedCompanyName) {
      toast.error("Company name is required");
      return;
    }
    if (normalizedCompanyName.length < 2) {
      toast.error("Company name must be at least 2 characters");
      return;
    }
    if (normalizedCompanyName.length > 120) {
      toast.error("Company name cannot exceed 120 characters");
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiClient.post("/company/register", { companyName: normalizedCompanyName });
      toast.success(response.data?.message || "Company created");
      setCompanyName("");
      fetchCompanies();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create company"));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCompany = async (companyId, companyName) => {
    if (!companyId) return;
    const shouldDelete = window.confirm(
      `Delete "${companyName || "this company"}"? This will also remove related jobs and applications.`
    );
    if (!shouldDelete) return;

    try {
      setDeletingCompanyId(companyId);
      const response = await apiClient.delete(`/company/${companyId}`);
      toast.success(response.data?.message || "Company deleted");
      setCompanies((previous) => previous.filter((company) => company._id !== companyId));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete this company"));
    } finally {
      setDeletingCompanyId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          eyebrow="Recruiter"
          title="Companies"
          description="Submit companies and wait for super admin approval before posting jobs."
        />

        <form className="grid gap-3 md:max-w-lg md:grid-cols-[1fr_auto]" onSubmit={createCompany}>
          <div>
            <Label htmlFor="companyName">New Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Acme Technologies"
              required
            />
          </div>
          <Button type="submit" className="self-end bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>
            {submitting ? "Creating..." : "Create"}
          </Button>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">Your Companies</h2>
        <p className="mt-1 text-sm text-slate-600">
          Only companies with approved status can be used for job postings.
        </p>

        {loading && <p className="mt-3 text-sm text-slate-600">Loading companies...</p>}

        {!loading && companies.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title="No companies yet"
              description="Create your first company to start posting jobs."
            />
          </div>
        )}

        {!loading && companies.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {companies.map((company) => (
              <article key={company._id} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      {company.name}
                    </h3>
                    <p className="mt-2">
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
                    <p className="mt-1 text-xs text-slate-500">Created {formatDate(company.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to={`/recruiter/companies/${company._id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCompany(company._id, company.name)}
                      disabled={deletingCompanyId === company._id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingCompanyId === company._id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default RecruiterCompaniesPage;
