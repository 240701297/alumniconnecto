import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Calendar, Megaphone, MessageSquare,
  Search, GraduationCap, LogOut, UserCircle, Inbox, BookOpen, Briefcase
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navByRole = {
  admin: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/alumni", icon: Users, label: "Manage Alumni" },
    { to: "/events", icon: Calendar, label: "Events" },
    { to: "/announcements", icon: Megaphone, label: "Announcements" },
    { to: "/jobs", icon: Briefcase, label: "Jobs Board" },
  ],
  alumni: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/profile", icon: UserCircle, label: "My Profile" },
    { to: "/events", icon: Calendar, label: "Events" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
    { to: "/requests", icon: Inbox, label: "Mentorship Requests" },
    { to: "/jobs", icon: Briefcase, label: "Post Jobs" },
  ],
  student: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/search", icon: Search, label: "Smart Connect" },
    { to: "/jobs", icon: Briefcase, label: "Jobs Board" },
    { to: "/events", icon: Calendar, label: "Events" },
    { to: "/messages", icon: MessageSquare, label: "Messages" },
    { to: "/mentorship", icon: BookOpen, label: "AI Career Hub" },
  ],
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const items = navByRole[role ?? "student"];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sidebar-primary-foreground">AlumniHub</h1>
              <p className="text-xs text-sidebar-foreground capitalize">{role} portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-smooth",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
                    : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <it.icon className="w-4 h-4" />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2 text-xs text-sidebar-foreground truncate">{user?.email}</div>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b bg-card px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">AlumniHub</span>
          </div>
          <Button size="sm" variant="ghost" onClick={handleLogout}><LogOut className="w-4 h-4" /></Button>
        </header>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b bg-card">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} className={({ isActive }) =>
              cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              <it.icon className="w-3.5 h-3.5" />{it.label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
