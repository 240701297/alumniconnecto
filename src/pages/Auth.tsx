import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  const [li, setLi] = useState({ email: "", password: "" });
  const [rg, setRg] = useState({
    name: "", email: "", password: "",
    role: "student" as "alumni" | "student",
    company: "", job_title: "", adminCode: "",
  });
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(li);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate("/dashboard");
  };

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const wantsAdmin = showAdmin && rg.adminCode.trim().length > 0;

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: rg.email,
      password: rg.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: rg.name,
          role: rg.role, // signup always grants student/alumni; admin must be claimed
          company: rg.company,
          job_title: rg.job_title,
        },
      },
    });

    if (error) { setBusy(false); return toast.error(error.message); }

    // If admin code provided, attempt to claim admin role
    if (wantsAdmin && signUpData.session) {
      try {
        const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/claim-admin`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${signUpData.session.access_token}`,
          },
          body: JSON.stringify({ code: rg.adminCode }),
        });
        const j = await res.json();
        if (!res.ok) {
          toast.error(j.error || "Admin code invalid — registered as " + rg.role);
        } else {
          toast.success("Admin access granted!");
        }
      } catch {
        toast.error("Could not verify admin code");
      }
    } else {
      toast.success("Account created!");
    }

    setBusy(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="text-primary-foreground hidden md:block">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">AlumniHub</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">Where alumni, students & mentors connect.</h2>
          <p className="text-primary-foreground/80 text-lg">
            AI-powered mentor matching, real jobs from alumni, and a thriving community to grow your career.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[{ n: "2,400+", l: "Alumni" }, { n: "150+", l: "Jobs" }, { n: "AI", l: "Matching" }].map((s) => (
              <div key={s.l} className="bg-primary-foreground/10 backdrop-blur rounded-lg p-4">
                <div className="text-2xl font-bold">{s.n}</div>
                <div className="text-sm text-primary-foreground/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Sign in or create your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={onLogin} className="space-y-4 mt-4">
                  <div><Label htmlFor="le">Email</Label>
                    <Input id="le" type="email" required value={li.email} onChange={(e) => setLi({ ...li, email: e.target.value })} /></div>
                  <div><Label htmlFor="lp">Password</Label>
                    <Input id="lp" type="password" required value={li.password} onChange={(e) => setLi({ ...li, password: e.target.value })} /></div>
                  <Button disabled={busy} className="w-full gradient-primary" type="submit">{busy ? "Signing in..." : "Sign in"}</Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={onRegister} className="space-y-3 mt-4">
                  <div><Label>Full name</Label>
                    <Input required value={rg.name} onChange={(e) => setRg({ ...rg, name: e.target.value })} /></div>
                  <div><Label>Email</Label>
                    <Input type="email" required value={rg.email} onChange={(e) => setRg({ ...rg, email: e.target.value })} /></div>
                  <div><Label>Password</Label>
                    <Input type="password" required minLength={6} value={rg.password} onChange={(e) => setRg({ ...rg, password: e.target.value })} /></div>
                  <div>
                    <Label>I am a</Label>
                    <Select value={rg.role} onValueChange={(v: any) => setRg({ ...rg, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {rg.role === "alumni" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Company</Label>
                        <Input value={rg.company} onChange={(e) => setRg({ ...rg, company: e.target.value })} /></div>
                      <div><Label>Job title</Label>
                        <Input value={rg.job_title} onChange={(e) => setRg({ ...rg, job_title: e.target.value })} /></div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAdmin((s) => !s)}
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {showAdmin ? "Hide admin access" : "I have an admin code"}
                  </button>
                  {showAdmin && (
                    <div className="bg-secondary p-3 rounded-lg">
                      <Label className="text-xs">Admin secret code</Label>
                      <Input
                        type="password"
                        placeholder="Enter the admin code"
                        value={rg.adminCode}
                        onChange={(e) => setRg({ ...rg, adminCode: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">Only one valid code grants admin. Wrong codes register you as {rg.role}.</p>
                    </div>
                  )}

                  <Button disabled={busy} className="w-full gradient-primary" type="submit">{busy ? "Creating..." : "Create account"}</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
