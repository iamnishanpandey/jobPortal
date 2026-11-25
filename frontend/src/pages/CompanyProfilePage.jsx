import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, Globe, MapPin, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatDate } from "@/lib/formatters";

const CompanyProfilePage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/company/get/${id}`);
        setCompany(response.data?.company || null);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load company profile"));
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-600">Loading company profile...</p>;
  }

  if (!company) {
    return <EmptyState title="Company not found" description="This company profile is not available." />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <SectionHeader
          eyebrow="Company Profile"
          title={company.name || "Company"}
          description="Review company details before continuing your application process."
          actions={
            <Link to="/applications">
              <Button variant="outline">Back to Applications</Button>
            </Link>
          }
        />

        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Building2 className="h-4 w-4 text-slate-500" /> {company.name || "Company"}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <MapPin className="h-4 w-4 text-slate-500" /> {company.location || "Location not specified"}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <CalendarDays className="h-4 w-4 text-slate-500" /> Created {formatDate(company.createdAt)}
          </p>
          <p className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <Globe className="h-4 w-4 text-slate-500" />
            {company.website ? (
              <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-700 hover:text-blue-800">
                Visit Website
              </a>
            ) : (
              "Website not available"
            )}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">About Company</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {company.description || "No company description available."}
        </p>
      </section>
    </div>
  );
};

export default CompanyProfilePage;
