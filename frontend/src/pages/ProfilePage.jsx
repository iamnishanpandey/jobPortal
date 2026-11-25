import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SectionHeader from "@/components/shared/SectionHeader";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { getInitials } from "@/lib/formatters";
import { isValidEmail, isValidPhoneNumber, trimText } from "@/lib/validation";
import { setUser } from "@/redux/authSlice";
import { isApplicantRole } from "@/utils/data";

const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];

const hasAllowedResumeExtension = (filename = "") =>
  ALLOWED_RESUME_EXTENSIONS.some((ext) => String(filename).toLowerCase().endsWith(ext));

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const [submitting, setSubmitting] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    bio: "",
    skills: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullname: user.fullname || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      bio: user.profile?.bio || "",
      skills: (user.profile?.skills || []).join(", "),
    });
    setProfilePhotoPreview(user.profile?.profilePhoto || "");
    setProfilePhotoFile(null);
    setResumeFile(null);
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setProfilePhotoFile(null);
      setProfilePhotoPreview(user?.profile?.profilePhoto || "");
      return;
    }
    if (!String(file.type || "").toLowerCase().startsWith("image/")) {
      toast.error("Profile photo must be an image file");
      event.target.value = "";
      return;
    }

    setProfilePhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setProfilePhotoPreview(previewUrl);
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setResumeFile(null);
      return;
    }

    if (!hasAllowedResumeExtension(file.name)) {
      toast.error("Resume must be a PDF, DOC, or DOCX file");
      event.target.value = "";
      return;
    }

    setResumeFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fullname = trimText(form.fullname);
    const email = trimText(form.email).toLowerCase();
    const phoneNumber = trimText(form.phoneNumber);
    const bio = trimText(form.bio);
    if (fullname.length < 2) {
      toast.error("Full name must be at least 2 characters");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Phone number must be between 7 and 15 digits");
      return;
    }
    if (bio.length > 1200) {
      toast.error("Bio cannot exceed 1200 characters");
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append("fullname", fullname);
      payload.append("email", email);
      payload.append("phoneNumber", phoneNumber);
      payload.append("bio", bio);
      payload.append("skills", form.skills);
      if (profilePhotoFile) payload.append("profilePhoto", profilePhotoFile);
      if (resumeFile) payload.append("resume", resumeFile);

      const response = await apiClient.post("/user/profile/update", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.user) {
        dispatch(setUser(response.data.user));
      }
      toast.success(response.data?.message || "Profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update profile"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <SectionHeader
        eyebrow="Account"
        title="Profile Settings"
        description="Update your personal information, profile photo, and resume."
      />

      <div className="mb-6 mt-2 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <Avatar className="h-16 w-16 border border-slate-300">
          <AvatarImage src={profilePhotoPreview || ""} alt={user?.fullname || "Profile photo"} />
          <AvatarFallback>{getInitials(user?.fullname)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-slate-900">{user?.fullname}</p>
          <p className="text-sm text-slate-600">{user?.email}</p>
        </div>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="fullname">Full Name</Label>
          <Input id="fullname" name="fullname" value={form.fullname} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="skills">Skills (comma separated)</Label>
          <Input id="skills" name="skills" value={form.skills} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="profilePhoto">Profile Photo</Label>
          <Input
            id="profilePhoto"
            name="profilePhoto"
            type="file"
            accept="image/*"
            onChange={handleProfilePhotoChange}
          />
        </div>
        {isApplicantRole(user?.role) ? (
          <div>
            <Label htmlFor="resume">Resume (PDF, DOC, DOCX)</Label>
            <Input
              id="resume"
              name="resume"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleResumeChange}
            />
            {resumeFile ? (
              <p className="mt-1 text-xs text-slate-600">Selected: {resumeFile.name}</p>
            ) : user?.profile?.resume ? (
              <a
                href={user.profile.resume}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Current: {user.profile.resumeOriginalName || "View resume"}
              </a>
            ) : (
              <p className="mt-1 text-xs text-slate-600">No resume uploaded yet.</p>
            )}
          </div>
        ) : null}
        <div className="md:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            placeholder="Tell recruiters about your strengths"
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700" disabled={submitting}>
            {submitting ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default ProfilePage;
