import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { isValidEmail, trimText } from "@/lib/validation";
import { setLoading, setUser } from "@/redux/authSlice";

const Signin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const { loading } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = location.state?.from || "/";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const email = trimText(form.email).toLowerCase();
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!form.password) {
      toast.error("Password is required");
      return;
    }

    try {
      dispatch(setLoading(true));
      const response = await apiClient.post("/user/login", {
        ...form,
        email,
      });
      if (response.data?.user) {
        dispatch(setUser(response.data.user));
      }
      toast.success(response.data?.message || "Signed in");
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Sign in failed"));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <section className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
      <p className="mt-1 text-sm text-slate-600">Access your account dashboard.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@email.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
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

        <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        New here?{" "}
        <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-800">
          Create an account
        </Link>
      </p>
    </section>
  );
};

export default Signin;
