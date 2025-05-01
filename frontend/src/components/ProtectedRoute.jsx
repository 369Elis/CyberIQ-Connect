import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        navigate("/login", { state: { from: location }, replace: true });
      } else if (!requireAuth && user) {
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate, location, requireAuth]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  return requireAuth ? (user ? children : null) : !user ? children : null;
};

export default ProtectedRoute;
