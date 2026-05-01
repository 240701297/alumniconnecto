import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    navigate(user ? "/dashboard" : "/auth", { replace: true });
  }, [user, loading, navigate]);
  return null;
}
