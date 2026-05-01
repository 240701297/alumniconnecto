import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/lib/auth";
import { GraduationCap } from "lucide-react";

export default function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: AppRole[] }) {
  const { user, role, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <GraduationCap className="w-10 h-10 text-primary-foreground animate-pulse" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  if (allow && role && !allow.includes(role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
