import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionHeader from "@/components/shared/SectionHeader";
import EmptyState from "@/components/shared/EmptyState";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { isValidUrl, trimText } from "@/lib/validation";

const companyStatusLabel = (status) => {
  const normalized = String(status || "pending").toLowerCase();
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Pending Approval";
};

const RecruiterCompanyEditPage = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/company/get/${id}`);
        const result = response.data?.company || null;
        setCompany(result);
        if (result) {
          setForm({
            name: result.name || "",
            description: result.description || "",
            website: result.website || "",
            location: result.location || "",
          });
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Could not load company"));
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = trimText(form.name);
    const location = trimText(form.location);
    const website = trimText(form.website);
    const description = trimText(form.description);
    if (name.length < 2) {
      toast.error("Company name must be at least 2 characters");
      return;
    }
    if (name.length > 120) {
      toast.error("Company name cannot exceed 120 characters");
      return;
    }
    if (location.length > 120) {
      toast.error("Location cannot exceed 120 characters");
      return;
    }
    if (!isValidUrl(website)) {
      toast.error("Website URL must start with http:// or https://");
      return;
    }
    if (description.length > 2000) {
      toast.error("Description cannot exceed 2000 characters");
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.put(`/company/update/${id}`, {
        ...form,
        name,
        location,
        website,
        description,
      });
      toast.success(response.data?.message || "Company updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update company"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-600">Loading company...</p>;

  if (!company) {
    return <EmptyState title="Company not found" description="This company is unavailable." />;
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <SectionHeader
        eyebrow="Recruiter"
        title={`Edit ${company.name}`}
        description="Updating details resubmits this company for super admin approval."
      />
      <p className="mb-4 text-sm text-slate-600">
        Current status:{" "}
        <span className="font-semibold text-slate-900">{companyStatusLabel(company.approvalStatus)}</span>
        {company.approvalNote ? ` | Note: ${company.approvalNote}` : ""}
      </p>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="name">Company Name</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" value={form.location} onChange={handleChange} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" name="website" value={form.website} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default RecruiterCompanyEditPage;
