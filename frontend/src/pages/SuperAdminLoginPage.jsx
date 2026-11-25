import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { trimText } from "@/lib/validation";
import { setLoading, setUser } from "@/redux/authSlice";
import { USER_ROLES } from "@/utils/data";

const SuperAdminLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((store) => store.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  if (user?.role === USER_ROLES.SUPER_ADMIN) {
    return <Navigate to="/super-admin/dashboard" replace />;
  }
  if (user && user.role !== USER_ROLES.SUPER_ADMIN) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const username = trimText(form.username).toLowerCase();
    if (!username) {
      toast.error("Username is required");
      return;
    }
    if (!form.password) {
      toast.error("Password is required");
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await apiClient.post("/user/login", {
        email: username,
        password: form.password,
        role: USER_ROLES.SUPER_ADMIN,
      });
      if (response.data?.user) {
        dispatch(setUser(response.data.user));
      }
      toast.success(response.data?.message || "Super admin signed in");
      navigate("/super-admin/dashboard", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Super admin sign in failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-8">
      <section className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-2 text-slate-100">
          <Shield className="h-5 w-5 text-emerald-400" />
          <h1 className="text-lg font-semibold tracking-wide">Admin Access</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="username" className="text-slate-200">
              Username
            </Label>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              className="mt-2 border-slate-600 bg-slate-900 text-slate-100"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-200">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="mt-2 border-slate-600 bg-slate-900 pr-10 text-slate-100"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 text-white hover:bg-emerald-700" disabled={loading}>
            {loading ? "Verifying..." : "Enter Portal"}
          </Button>
        </form>
      </section>
    </div>
  );
};

export default SuperAdminLoginPage;
