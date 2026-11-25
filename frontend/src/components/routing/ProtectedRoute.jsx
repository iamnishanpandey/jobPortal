import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ allowRoles }) => {
  const { user } = useSelector((store) => store.auth);
  const location = useLocation();

  if (!user) {
    if (location.pathname.startsWith("/super-admin")) {
      return <Navigate to="/super-admin/access" replace />;
    }
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  if (allowRoles?.length && !allowRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
