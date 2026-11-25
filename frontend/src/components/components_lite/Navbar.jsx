import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu, X, LogOut, UserCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import apiClient from "@/lib/apiClient";
import { getApiErrorMessage } from "@/lib/apiError";
import { getInitials } from "@/lib/formatters";
import { logout } from "@/redux/authSlice";
import { normalizeRoleLabel, USER_ROLES } from "@/utils/data";
import { toast } from "sonner";

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  }`;

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = useMemo(() => {
    if (!user) {
      return [{ label: "Home", to: "/" }, { label: "Jobs", to: "/jobs" }];
    }

    if (user.role === USER_ROLES.RECRUITER) {
      return [
        { label: "Home", to: "/" },
        { label: "Companies", to: "/recruiter/companies" },
        { label: "Manage Jobs", to: "/recruiter/jobs" },
      ];
    }

    if (user.role === USER_ROLES.SUPER_ADMIN) {
      return [
        { label: "Home", to: "/" },
        { label: "Super Admin", to: "/super-admin/dashboard" },
      ];
    }

    return [
      { label: "Home", to: "/" },
      { label: "Jobs", to: "/jobs" },
      { label: "My Applications", to: "/applications" },
    ];
  }, [user]);

  const onLogout = async () => {
    try {
      const isSuperAdmin = user?.role === USER_ROLES.SUPER_ADMIN;
      await apiClient.post("/user/logout");
      dispatch(logout());
      toast.success("Signed out");
      navigate(isSuperAdmin ? "/" : "/signin", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to sign out"));
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="text-2xl font-bold tracking-tight text-slate-900">
          CC <span className="text-blue-600">CareerCloud</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <>
              <Link to="/signin">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">Sign Up</Button>
              </Link>
            </>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Avatar className="h-9 w-9 border border-slate-200">
                    <AvatarImage
                      src={user?.profile?.profilePhoto || "https://github.com/shadcn.png"}
                      alt={user?.fullname || "User avatar"}
                    />
                    <AvatarFallback>{getInitials(user?.fullname)}</AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900">{user?.fullname}</p>
                    <p className="text-sm text-slate-600">{user?.email}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-700">
                      {normalizeRoleLabel(user?.role)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link to="/profile">
                      <Button variant="outline" className="w-full justify-start">
                        <UserCircle2 className="mr-2 h-4 w-4" /> Profile
                      </Button>
                    </Link>
                    <Button variant="destructive" className="w-full justify-start" onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <button
          type="button"
          className="inline-flex rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMobileOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            {!user ? (
              <div className="mt-2 flex gap-2">
                <Link to="/signin" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">Sign Up</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <Link to="/profile" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <UserCircle2 className="mr-2 h-4 w-4" /> Profile
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
