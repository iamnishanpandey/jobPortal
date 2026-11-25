import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { isValidEmail, isValidPhoneNumber, trimText } from "@/lib/validation";
import { setLoading } from "@/redux/authSlice";
import { USER_ROLES } from "@/utils/data";

const Signup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector((store) => store.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: USER_ROLES.APPLICANT,
    file: null,
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleFile = (event) => {
    setForm((previous) => ({ ...previous, file: event.target.files?.[0] || null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fullname = trimText(form.fullname);
    const email = trimText(form.email).toLowerCase();
    const phoneNumber = trimText(form.phoneNumber);
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
    if (String(form.password || "").length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      dispatch(setLoading(true));
      const payload = new FormData();
      payload.append("fullname", fullname);
      payload.append("email", email);
      payload.append("password", form.password);
      payload.append("phoneNumber", phoneNumber);
      payload.append("role", form.role);
      if (form.file) payload.append("file", form.file);

      const response = await apiClient.post("/user/register", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(response.data?.message || "Account created");
      navigate("/signin");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Sign up failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
      <p className="mt-1 text-sm text-slate-600">Join the portal as an applicant or recruiter.</p>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2">
          <Label htmlFor="fullname">Full Name</Label>
          <Input id="fullname" name="fullname" value={form.fullname} onChange={handleChange} required />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-2 h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value={USER_ROLES.APPLICANT}>Applicant</option>
            <option value={USER_ROLES.RECRUITER}>Recruiter</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="file">Profile Photo (optional)</Label>
          <Input id="file" name="file" type="file" accept="image/*" onChange={handleFile} />
        </div>

        <div className="md:col-span-2">
          <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-blue-700 hover:text-blue-800">
          Sign in
        </Link>
      </p>
    </section>
  );
};

export default Signup;
